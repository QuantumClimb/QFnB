-- ==============================================================================
-- Migration: 20260919000010_phase3f1_orders_integrity.sql
-- Description: Phase 3F.1 - Orders Data Integrity + Service Lifecycle Hardening (LOCAL ONLY)
-- Strict Constraints:
-- 1. Disallow multiple active orders per table (partial unique index)
-- 2. Canonical 'pending' item status enum
-- 3. Composite multi-tenant foreign keys for orders, items, and history
-- 4. Staff tenant authorization check for opened_by and assigned_staff_id
-- 5. Order -> Waitlist tenant consistency
-- 6. Item status transition validation (prevent terminal mutations)
-- 7. Hardened order derived status computation
-- DO NOT APPLY REMOTELY
-- ==============================================================================

-- 1. Canonical 'pending' status for order items
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = 'public.order_item_status_enum'::regtype 
          AND enumlabel = 'pending'
    ) THEN
        ALTER TYPE public.order_item_status_enum ADD VALUE 'pending';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Prevent Multiple Active Orders per Table (Partial Unique Index)
-- Completed and cancelled orders do not block opening a new order for a table
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_order_per_table
    ON public.orders (table_id)
    WHERE status NOT IN ('completed', 'cancelled') AND table_id IS NOT NULL;

-- 3. Composite Multi-Tenant Keys and Foreign Keys
-- Ensure physical engine-level prevention of cross-tenant child records
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_orders_id_org_outlet'
    ) THEN
        ALTER TABLE public.orders 
            ADD CONSTRAINT uq_orders_id_org_outlet UNIQUE (id, organization_id, outlet_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_order_items_parent_composite'
    ) THEN
        ALTER TABLE public.order_items
            ADD CONSTRAINT fk_order_items_parent_composite
            FOREIGN KEY (order_id, organization_id, outlet_id)
            REFERENCES public.orders(id, organization_id, outlet_id)
            ON DELETE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_order_items_id_org_outlet'
    ) THEN
        ALTER TABLE public.order_items
            ADD CONSTRAINT uq_order_items_id_org_outlet UNIQUE (id, organization_id, outlet_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_order_item_history_parent_composite'
    ) THEN
        ALTER TABLE public.order_item_status_history
            ADD CONSTRAINT fk_order_item_history_parent_composite
            FOREIGN KEY (order_item_id, organization_id, outlet_id)
            REFERENCES public.order_items(id, organization_id, outlet_id)
            ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Order -> Waitlist Tenant Consistency Trigger
CREATE OR REPLACE FUNCTION public.check_order_waitlist_consistency()
RETURNS TRIGGER AS $$
DECLARE
    v_waitlist_org UUID;
    v_waitlist_outlet UUID;
BEGIN
    IF NEW.waitlist_entry_id IS NOT NULL THEN
        SELECT organization_id, outlet_id INTO v_waitlist_org, v_waitlist_outlet
        FROM public.waitlist_entries
        WHERE id = NEW.waitlist_entry_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Referenced waitlist_entry does not exist'
                USING ERRCODE = '23503';
        END IF;

        IF v_waitlist_org <> NEW.organization_id OR v_waitlist_outlet <> NEW.outlet_id THEN
            RAISE EXCEPTION 'Cross-tenant waitlist linkage rejected: Waitlist (%, %) does not match Order (%, %)',
                v_waitlist_org, v_waitlist_outlet, NEW.organization_id, NEW.outlet_id
                USING ERRCODE = '23514';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_order_waitlist ON public.orders;
CREATE TRIGGER trg_check_order_waitlist
    BEFORE INSERT OR UPDATE OF waitlist_entry_id, organization_id, outlet_id
    ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.check_order_waitlist_consistency();

-- 5. Order Staff Authorization Consistency Trigger
-- Ensures opened_by and assigned_staff_id have valid outlet access in the specified tenant
CREATE OR REPLACE FUNCTION public.check_order_staff_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- Check opened_by
    IF NEW.opened_by IS NOT NULL THEN
        IF NOT public.has_outlet_access(NEW.opened_by, NEW.organization_id, NEW.outlet_id) THEN
            RAISE EXCEPTION 'Order opened_by staff % does not have access to Organization % and Outlet %',
                NEW.opened_by, NEW.organization_id, NEW.outlet_id
                USING ERRCODE = '23514';
        END IF;
    END IF;

    -- Check assigned_staff_id
    IF NEW.assigned_staff_id IS NOT NULL THEN
        IF NOT public.has_outlet_access(NEW.assigned_staff_id, NEW.organization_id, NEW.outlet_id) THEN
            RAISE EXCEPTION 'Order assigned_staff_id % does not have access to Organization % and Outlet %',
                NEW.assigned_staff_id, NEW.organization_id, NEW.outlet_id
                USING ERRCODE = '23514';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_order_staff ON public.orders;
CREATE TRIGGER trg_check_order_staff
    BEFORE INSERT OR UPDATE OF opened_by, assigned_staff_id, organization_id, outlet_id
    ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.check_order_staff_consistency();

-- 6. Item Status Transition Validation Trigger
-- Enforces clean forward progression and prevents invalid mutations on terminal states
CREATE OR REPLACE FUNCTION public.validate_order_item_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- If status did not change, allow
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Terminal states cannot be altered
    IF OLD.status = 'served' THEN
        RAISE EXCEPTION 'Invalid transition: Item % is already served and cannot transition to %',
            OLD.id, NEW.status
            USING ERRCODE = '23514';
    END IF;

    IF OLD.status = 'cancelled' THEN
        RAISE EXCEPTION 'Invalid transition: Item % is cancelled and cannot transition to %',
            OLD.id, NEW.status
            USING ERRCODE = '23514';
    END IF;

    -- Valid non-terminal transitions
    IF OLD.status IN ('pending', 'draft') AND NEW.status NOT IN ('sent', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition: Unsent item % can only transition to sent or cancelled, not %',
            OLD.id, NEW.status
            USING ERRCODE = '23514';
    END IF;

    IF OLD.status = 'sent' AND NEW.status NOT IN ('accepted', 'preparing', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition: Sent item % cannot transition directly to %',
            OLD.id, NEW.status
            USING ERRCODE = '23514';
    END IF;

    IF OLD.status = 'accepted' AND NEW.status NOT IN ('preparing', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition: Accepted item % cannot transition directly to %',
            OLD.id, NEW.status
            USING ERRCODE = '23514';
    END IF;

    IF OLD.status = 'preparing' AND NEW.status NOT IN ('ready', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition: Preparing item % cannot transition directly to %',
            OLD.id, NEW.status
            USING ERRCODE = '23514';
    END IF;

    IF OLD.status = 'ready' AND NEW.status NOT IN ('served', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition: Ready item % cannot transition to %',
            OLD.id, NEW.status
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_order_item_status ON public.order_items;
CREATE TRIGGER trg_validate_order_item_status
    BEFORE UPDATE OF status
    ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_order_item_status_transition();

-- 7. Hardened Order Derived Status Trigger
-- Recalculates order status based on all constituent items
CREATE OR REPLACE FUNCTION public.update_order_derived_status()
RETURNS TRIGGER AS $$
DECLARE
    v_order_id UUID;
    v_total_items INTEGER;
    v_cancelled_items INTEGER;
    v_active_items INTEGER;
    v_pending_items INTEGER;
    v_sent_items INTEGER;
    v_preparing_items INTEGER;
    v_ready_items INTEGER;
    v_served_items INTEGER;
    v_current_order_status public.order_status_enum;
BEGIN
    v_order_id := COALESCE(NEW.order_id, OLD.order_id);

    -- Fetch current order status
    SELECT status INTO v_current_order_status
    FROM public.orders
    WHERE id = v_order_id;

    -- Do not overwrite manually completed or cancelled orders
    IF v_current_order_status IN ('completed', 'cancelled') THEN
        RETURN NEW;
    END IF;

    -- Count item states
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'cancelled'),
        COUNT(*) FILTER (WHERE status IN ('pending', 'draft')),
        COUNT(*) FILTER (WHERE status = 'sent'),
        COUNT(*) FILTER (WHERE status IN ('accepted', 'preparing')),
        COUNT(*) FILTER (WHERE status = 'ready'),
        COUNT(*) FILTER (WHERE status = 'served')
    INTO 
        v_total_items,
        v_cancelled_items,
        v_pending_items,
        v_sent_items,
        v_preparing_items,
        v_ready_items,
        v_served_items
    FROM public.order_items
    WHERE order_id = v_order_id;

    v_active_items := v_total_items - v_cancelled_items;

    IF v_total_items = 0 OR v_active_items = 0 THEN
        -- If all items cancelled or no items, retain open
        UPDATE public.orders SET status = 'open', updated_at = NOW() WHERE id = v_order_id;
    ELSIF v_served_items = v_active_items THEN
        -- All active items served
        UPDATE public.orders SET status = 'served', updated_at = NOW() WHERE id = v_order_id;
    ELSIF v_served_items > 0 THEN
        -- Some items served, others remaining in prep/ready/sent/pending
        UPDATE public.orders SET status = 'partially_served', updated_at = NOW() WHERE id = v_order_id;
    ELSIF v_ready_items = v_active_items THEN
        -- All active items ready on pass
        UPDATE public.orders SET status = 'ready', updated_at = NOW() WHERE id = v_order_id;
    ELSIF (v_preparing_items > 0 OR v_ready_items > 0) THEN
        -- Cooking underway or partial items ready on pass
        UPDATE public.orders SET status = 'in_progress', updated_at = NOW() WHERE id = v_order_id;
    ELSIF v_sent_items > 0 THEN
        -- Items sent to kitchen/bar stations
        IF v_pending_items > 0 THEN
            UPDATE public.orders SET status = 'in_progress', updated_at = NOW() WHERE id = v_order_id;
        ELSE
            UPDATE public.orders SET status = 'sent', updated_at = NOW() WHERE id = v_order_id;
        END IF;
    ELSE
        -- All items are pending/draft
        UPDATE public.orders SET status = 'open', updated_at = NOW() WHERE id = v_order_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_order_derived_status ON public.order_items;
CREATE TRIGGER trg_update_order_derived_status
    AFTER INSERT OR UPDATE OF status OR DELETE
    ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_order_derived_status();
