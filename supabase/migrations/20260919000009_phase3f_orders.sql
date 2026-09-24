-- ==============================================================================
-- Migration: 20260919000009_phase3f_orders.sql
-- Description: Phase 3F - Orders, Order Items, Station Routing & Service History (LOCAL ONLY)
-- Strict Constraints: Multi-tenant scoped, tenant triggers, item audit history
-- DO NOT APPLY REMOTELY
-- ==============================================================================

-- 1. Create Order Enums
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status_enum') THEN
        CREATE TYPE public.order_status_enum AS ENUM (
            'open',
            'sent',
            'in_progress',
            'ready',
            'partially_served',
            'served',
            'completed',
            'cancelled'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_item_status_enum') THEN
        CREATE TYPE public.order_item_status_enum AS ENUM (
            'pending',
            'draft',
            'sent',
            'accepted',
            'preparing',
            'ready',
            'served',
            'cancelled'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_type_enum') THEN
        CREATE TYPE public.course_type_enum AS ENUM (
            'drinks',
            'starter',
            'main',
            'side',
            'dessert',
            'other'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_station_enum') THEN
        CREATE TYPE public.service_station_enum AS ENUM (
            'kitchen',
            'bar',
            'dessert',
            'service'
        );
    END IF;
END $$;

-- 2. Create orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
    
    table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
    waitlist_entry_id UUID REFERENCES public.waitlist_entries(id) ON DELETE SET NULL,
    
    guest_name TEXT,
    order_number TEXT NOT NULL,
    
    status public.order_status_enum NOT NULL DEFAULT 'open',
    
    opened_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create order_items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    
    item_name TEXT NOT NULL,
    menu_item_id TEXT,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    
    seat_number INTEGER CHECK (seat_number > 0),
    course public.course_type_enum NOT NULL DEFAULT 'main',
    destination_station public.service_station_enum NOT NULL DEFAULT 'kitchen',
    
    status public.order_item_status_enum NOT NULL DEFAULT 'draft',
    
    modifiers TEXT[],
    cooking_preference TEXT,
    allergy_notes TEXT[],
    special_instructions TEXT,
    
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    sent_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    ready_at TIMESTAMPTZ,
    served_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create order_item_status_history Table
CREATE TABLE IF NOT EXISTS public.order_item_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
    
    old_status public.order_item_status_enum,
    new_status public.order_item_status_enum NOT NULL,
    
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    note TEXT
);

-- 5. Database-Side Multi-Tenant Consistency Triggers

-- Trigger 5.1: Validate Order Table Tenancy
CREATE OR REPLACE FUNCTION public.check_order_table_consistency()
RETURNS TRIGGER AS $$
DECLARE
    v_table_org UUID;
    v_table_outlet UUID;
BEGIN
    IF NEW.table_id IS NOT NULL THEN
        SELECT organization_id, outlet_id INTO v_table_org, v_table_outlet
        FROM public.restaurant_tables
        WHERE id = NEW.table_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Referenced restaurant_table does not exist'
                USING ERRCODE = '23503';
        END IF;

        IF v_table_org <> NEW.organization_id OR v_table_outlet <> NEW.outlet_id THEN
            RAISE EXCEPTION 'Cross-tenant table assignment rejected: Table (%, %) does not match Order (%, %)',
                v_table_org, v_table_outlet, NEW.organization_id, NEW.outlet_id
                USING ERRCODE = '23514';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_order_table ON public.orders;
CREATE TRIGGER trg_check_order_table
    BEFORE INSERT OR UPDATE OF table_id, organization_id, outlet_id
    ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.check_order_table_consistency();

-- Trigger 5.2: Validate Order Reservation Tenancy
CREATE OR REPLACE FUNCTION public.check_order_reservation_consistency()
RETURNS TRIGGER AS $$
DECLARE
    v_res_org UUID;
    v_res_outlet UUID;
BEGIN
    IF NEW.reservation_id IS NOT NULL THEN
        SELECT organization_id, outlet_id INTO v_res_org, v_res_outlet
        FROM public.reservations
        WHERE id = NEW.reservation_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Referenced reservation does not exist'
                USING ERRCODE = '23503';
        END IF;

        IF v_res_org <> NEW.organization_id OR v_res_outlet <> NEW.outlet_id THEN
            RAISE EXCEPTION 'Cross-tenant reservation linkage rejected: Reservation (%, %) does not match Order (%, %)',
                v_res_org, v_res_outlet, NEW.organization_id, NEW.outlet_id
                USING ERRCODE = '23514';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_order_reservation ON public.orders;
CREATE TRIGGER trg_check_order_reservation
    BEFORE INSERT OR UPDATE OF reservation_id, organization_id, outlet_id
    ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.check_order_reservation_consistency();

-- Trigger 5.3: Validate Order Item Tenancy
CREATE OR REPLACE FUNCTION public.check_order_item_order_consistency()
RETURNS TRIGGER AS $$
DECLARE
    v_order_org UUID;
    v_order_outlet UUID;
BEGIN
    SELECT organization_id, outlet_id INTO v_order_org, v_order_outlet
    FROM public.orders
    WHERE id = NEW.order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Referenced order does not exist'
            USING ERRCODE = '23503';
    END IF;

    IF v_order_org <> NEW.organization_id OR v_order_outlet <> NEW.outlet_id THEN
        RAISE EXCEPTION 'Cross-tenant order item rejected: Order (%, %) does not match Item (%, %)',
            v_order_org, v_order_outlet, NEW.organization_id, NEW.outlet_id
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_order_item_order ON public.order_items;
CREATE TRIGGER trg_check_order_item_order
    BEFORE INSERT OR UPDATE OF order_id, organization_id, outlet_id
    ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.check_order_item_order_consistency();

-- Trigger 5.4: Validate Order Item History Tenancy
CREATE OR REPLACE FUNCTION public.check_order_item_history_consistency()
RETURNS TRIGGER AS $$
DECLARE
    v_item_org UUID;
    v_item_outlet UUID;
BEGIN
    SELECT organization_id, outlet_id INTO v_item_org, v_item_outlet
    FROM public.order_items
    WHERE id = NEW.order_item_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Referenced order_item does not exist'
            USING ERRCODE = '23503';
    END IF;

    IF v_item_org <> NEW.organization_id OR v_item_outlet <> NEW.outlet_id THEN
        RAISE EXCEPTION 'Cross-tenant item history rejected: Item (%, %) does not match Status History (%, %)',
            v_item_org, v_item_outlet, NEW.organization_id, NEW.outlet_id
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_order_item_history ON public.order_item_status_history;
CREATE TRIGGER trg_check_order_item_history
    BEFORE INSERT OR UPDATE OF order_item_id, organization_id, outlet_id
    ON public.order_item_status_history
    FOR EACH ROW
    EXECUTE FUNCTION public.check_order_item_history_consistency();

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_orders_outlet_status_opened
    ON public.orders(outlet_id, status, opened_at);

CREATE INDEX IF NOT EXISTS idx_orders_table_status
    ON public.orders(table_id, status);

CREATE INDEX IF NOT EXISTS idx_order_items_order_status
    ON public.order_items(order_id, status);

CREATE INDEX IF NOT EXISTS idx_order_items_station_status
    ON public.order_items(destination_station, status);

CREATE INDEX IF NOT EXISTS idx_order_item_history_item
    ON public.order_item_status_history(order_item_id, changed_at);

-- 7. Row Level Security Policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_tenant_isolation" ON public.orders;
CREATE POLICY "orders_tenant_isolation"
    ON public.orders
    FOR ALL
    USING (public.has_outlet_access(auth.uid(), organization_id, outlet_id))
    WITH CHECK (public.has_outlet_access(auth.uid(), organization_id, outlet_id));

DROP POLICY IF EXISTS "order_items_tenant_isolation" ON public.order_items;
CREATE POLICY "order_items_tenant_isolation"
    ON public.order_items
    FOR ALL
    USING (public.has_outlet_access(auth.uid(), organization_id, outlet_id))
    WITH CHECK (public.has_outlet_access(auth.uid(), organization_id, outlet_id));

DROP POLICY IF EXISTS "order_item_history_tenant_isolation" ON public.order_item_status_history;
CREATE POLICY "order_item_history_tenant_isolation"
    ON public.order_item_status_history
    FOR ALL
    USING (public.has_outlet_access(auth.uid(), organization_id, outlet_id))
    WITH CHECK (public.has_outlet_access(auth.uid(), organization_id, outlet_id));
