-- ==============================================================================
-- Migration: 20260920000013_phase3h1_offers_integrity.sql
-- Description: Phase 3H.1 - Offers & Experiences Integrity Hardening (LOCAL ONLY)
-- Strict Hardening Rules:
-- 1. Re-affirm and audit public.has_organization_access() helper for organization-level catalogue access
-- 2. Dual-Scope RLS verification: Ensure experiences, experience_addons, offers, and rules never require outlet access on NULL outlet_id
-- 3. Experience attachment: Require experience.status = 'active', matching organization, and outlet match if outlet_id is NOT NULL
-- 4. Add-on compatibility: Enforce explicit Rule A (if addon.experience_id is populated, that experience must be attached to the reservation)
-- 5. Attachment Status Machine: Enforce pending -> confirmed -> fulfilled, and cancellation only from pending or confirmed
-- 6. Price Snapshot Immutability: Lock unit_price_snapshot and currency_code once status is confirmed or fulfilled
-- DO NOT APPLY REMOTELY
-- ==============================================================================

-- 1. Verify / Re-affirm public.has_organization_access()
CREATE OR REPLACE FUNCTION public.has_organization_access(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- 1. Direct membership in organization_members (owner, admin, etc.)
    IF EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE user_id = _user_id AND organization_id = _org_id
    ) THEN
        RETURN TRUE;
    END IF;

    -- 2. Operational staff assigned to any outlet within this organization
    RETURN EXISTS (
        SELECT 1 FROM public.outlet_members om
        JOIN public.outlets o ON o.id = om.outlet_id
        WHERE om.user_id = _user_id AND o.organization_id = _org_id
    );
END;
$$;

-- 2. Experience Attachment Lifecycle & Tenant Hardening Trigger
CREATE OR REPLACE FUNCTION public.check_reservation_experience_consistency_hardened()
RETURNS TRIGGER AS $$
DECLARE
    v_res_org UUID;
    v_res_outlet UUID;
    v_exp_org UUID;
    v_exp_outlet UUID;
    v_exp_status TEXT;
BEGIN
    -- Validate Reservation existence & tenant
    SELECT organization_id, outlet_id INTO v_res_org, v_res_outlet
    FROM public.reservations
    WHERE id = NEW.reservation_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Referenced reservation % does not exist', NEW.reservation_id
            USING ERRCODE = '23503';
    END IF;

    IF v_res_org <> NEW.organization_id OR v_res_outlet <> NEW.outlet_id THEN
        RAISE EXCEPTION 'Reservation org/outlet (%, %) does not match attachment (%, %)',
            v_res_org, v_res_outlet, NEW.organization_id, NEW.outlet_id
            USING ERRCODE = '23514';
    END IF;

    -- Validate Experience existence & tenant
    SELECT organization_id, outlet_id, status INTO v_exp_org, v_exp_outlet, v_exp_status
    FROM public.experiences
    WHERE id = NEW.experience_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Referenced experience % does not exist', NEW.experience_id
            USING ERRCODE = '23503';
    END IF;

    IF v_exp_org <> NEW.organization_id THEN
        RAISE EXCEPTION 'Cross-tenant experience attachment rejected: Exp org (%) <> Attachment org (%)',
            v_exp_org, NEW.organization_id
            USING ERRCODE = '23514';
    END IF;

    -- Outlet Scope Enforcement:
    -- If experience.outlet_id IS NULL -> Allowed in all outlets of the same organization.
    -- If experience.outlet_id IS NOT NULL -> Must equal reservation.outlet_id.
    IF v_exp_outlet IS NOT NULL AND v_exp_outlet <> NEW.outlet_id THEN
        RAISE EXCEPTION 'Experience is scoped to outlet %, cannot attach to reservation in outlet %',
            v_exp_outlet, NEW.outlet_id
            USING ERRCODE = '23514';
    END IF;

    -- Status validation upon attachment:
    -- Cannot attach an experience that is draft, paused, expired, or archived
    IF TG_OP = 'INSERT' AND v_exp_status <> 'active' THEN
        RAISE EXCEPTION 'Cannot attach experience with status "%" (must be active)', v_exp_status
            USING ERRCODE = '23514';
    END IF;

    -- Status Transition State Machine Guards (UPDATE)
    IF TG_OP = 'UPDATE' THEN
        -- Check terminal states
        IF OLD.status = 'fulfilled' AND NEW.status <> 'fulfilled' THEN
            RAISE EXCEPTION 'Cannot transition fulfilled experience attachment: terminal state'
                USING ERRCODE = '23514';
        END IF;

        IF OLD.status = 'cancelled' AND NEW.status <> 'cancelled' THEN
            RAISE EXCEPTION 'Cannot transition cancelled experience attachment: terminal state'
                USING ERRCODE = '23514';
        END IF;

        -- Valid transitions
        IF OLD.status = 'pending' AND NEW.status NOT IN ('pending', 'confirmed', 'cancelled') THEN
            RAISE EXCEPTION 'Invalid status transition from pending to %', NEW.status
                USING ERRCODE = '23514';
        END IF;

        IF OLD.status = 'confirmed' AND NEW.status NOT IN ('confirmed', 'fulfilled', 'cancelled') THEN
            RAISE EXCEPTION 'Invalid status transition from confirmed to %', NEW.status
                USING ERRCODE = '23514';
        END IF;

        -- Price Snapshot Immutability Guard:
        -- Once confirmed or fulfilled, unit_price_snapshot and currency_code cannot be modified
        IF OLD.status IN ('confirmed', 'fulfilled') THEN
            IF NEW.unit_price_snapshot IS DISTINCT FROM OLD.unit_price_snapshot THEN
                RAISE EXCEPTION 'Price snapshot is locked and cannot be modified once confirmed or fulfilled'
                    USING ERRCODE = '23514';
            END IF;

            IF NEW.currency_code IS DISTINCT FROM OLD.currency_code THEN
                RAISE EXCEPTION 'Currency code is locked and cannot be modified once confirmed or fulfilled'
                    USING ERRCODE = '23514';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_reservation_experience ON public.reservation_experiences;
CREATE TRIGGER trg_check_reservation_experience
    BEFORE INSERT OR UPDATE
    ON public.reservation_experiences
    FOR EACH ROW
    EXECUTE FUNCTION public.check_reservation_experience_consistency_hardened();

-- 3. Addon Attachment Consistency & Explicit Rule A Enforcement
CREATE OR REPLACE FUNCTION public.check_reservation_addon_consistency_hardened()
RETURNS TRIGGER AS $$
DECLARE
    v_res_org UUID;
    v_res_outlet UUID;
    v_addon_org UUID;
    v_addon_outlet UUID;
    v_addon_exp UUID;
    v_addon_active BOOLEAN;
    v_exp_attached_exists BOOLEAN;
BEGIN
    -- Validate Reservation
    SELECT organization_id, outlet_id INTO v_res_org, v_res_outlet
    FROM public.reservations
    WHERE id = NEW.reservation_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Referenced reservation % does not exist', NEW.reservation_id
            USING ERRCODE = '23503';
    END IF;

    IF v_res_org <> NEW.organization_id OR v_res_outlet <> NEW.outlet_id THEN
        RAISE EXCEPTION 'Reservation org/outlet (%, %) does not match attachment (%, %)',
            v_res_org, v_res_outlet, NEW.organization_id, NEW.outlet_id
            USING ERRCODE = '23514';
    END IF;

    -- Validate Addon
    SELECT organization_id, outlet_id, experience_id, is_active
    INTO v_addon_org, v_addon_outlet, v_addon_exp, v_addon_active
    FROM public.experience_addons
    WHERE id = NEW.addon_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Referenced addon % does not exist', NEW.addon_id
            USING ERRCODE = '23503';
    END IF;

    IF v_addon_org <> NEW.organization_id THEN
        RAISE EXCEPTION 'Cross-tenant addon rejected: Addon org (%) <> Attachment org (%)',
            v_addon_org, NEW.organization_id
            USING ERRCODE = '23514';
    END IF;

    -- Outlet scoping: if addon has outlet_id, must match reservation outlet
    IF v_addon_outlet IS NOT NULL AND v_addon_outlet <> NEW.outlet_id THEN
        RAISE EXCEPTION 'Addon scoped to outlet %, cannot attach to reservation in outlet %',
            v_addon_outlet, NEW.outlet_id
            USING ERRCODE = '23514';
    END IF;

    IF TG_OP = 'INSERT' AND NOT v_addon_active THEN
        RAISE EXCEPTION 'Cannot attach inactive add-on %', NEW.addon_id
            USING ERRCODE = '23514';
    END IF;

    -- Explicit Rule A:
    -- If the add-on is tied to a specific experience (v_addon_exp IS NOT NULL or NEW.experience_id IS NOT NULL),
    -- that experience MUST be actively attached to this reservation in reservation_experiences.
    IF v_addon_exp IS NOT NULL THEN
        NEW.experience_id := v_addon_exp;
    END IF;

    IF NEW.experience_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.reservation_experiences
            WHERE reservation_id = NEW.reservation_id
              AND experience_id = NEW.experience_id
              AND status IN ('pending', 'confirmed', 'fulfilled')
        ) INTO v_exp_attached_exists;

        IF NOT v_exp_attached_exists THEN
            RAISE EXCEPTION 'Addon requires experience % to be attached to reservation % (Rule A)',
                NEW.experience_id, NEW.reservation_id
                USING ERRCODE = '23514';
        END IF;
    END IF;

    -- Price Snapshot Immutability Guard on Update:
    IF TG_OP = 'UPDATE' THEN
        IF NEW.unit_price_snapshot IS DISTINCT FROM OLD.unit_price_snapshot THEN
            RAISE EXCEPTION 'Addon price snapshot is immutable once attached'
                USING ERRCODE = '23514';
        END IF;

        IF NEW.currency_code IS DISTINCT FROM OLD.currency_code THEN
            RAISE EXCEPTION 'Addon currency code is immutable once attached'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_reservation_addon ON public.reservation_addons;
CREATE TRIGGER trg_check_reservation_addon
    BEFORE INSERT OR UPDATE
    ON public.reservation_addons
    FOR EACH ROW
    EXECUTE FUNCTION public.check_reservation_addon_consistency_hardened();
