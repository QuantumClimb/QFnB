-- ==============================================================================
-- Migration: 20260920000012_phase3h_offers_experiences.sql
-- Description: Phase 3H - Hospitality Offers & Experiences Engine (LOCAL ONLY)
-- Strict Constraints:
-- 1. Dual-scope catalog items: Organization-wide (outlet_id IS NULL) or Outlet-specific (outlet_id IS NOT NULL)
-- 2. Operational link tables: reservation_experiences, reservation_addons with price snapshotting
-- 3. Tenant integrity triggers across experiences, seating areas, add-ons, offers, and reservations
-- 4. Status and check constraints (party size bounds, positive durations, non-negative prices, valid date intervals)
-- 5. Hardened RLS policies with public.has_organization_access() and public.has_outlet_access()
-- 6. Zero payment boundary: product catalog metadata only, no billing or settlement
-- DO NOT APPLY REMOTELY
-- ==============================================================================

-- 1. Create experiences Table
CREATE TABLE IF NOT EXISTS public.experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE, -- NULL = Org-wide catalogue
    
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    short_description TEXT,
    description TEXT,
    
    category TEXT NOT NULL CHECK (
        category IN (
            'celebration',
            'romantic',
            'private_dining',
            'tasting',
            'wine',
            'live_entertainment',
            'corporate',
            'family',
            'seasonal',
            'other'
        )
    ),
    
    status TEXT NOT NULL DEFAULT 'draft' CHECK (
        status IN ('draft', 'active', 'paused', 'expired', 'archived')
    ),
    
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    
    minimum_party_size INTEGER NOT NULL DEFAULT 1 CHECK (minimum_party_size > 0),
    maximum_party_size INTEGER NOT NULL DEFAULT 6 CHECK (maximum_party_size >= minimum_party_size),
    
    duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes > 0),
    
    base_price NUMERIC(10, 2) CHECK (base_price IS NULL OR base_price >= 0),
    currency_code TEXT NOT NULL DEFAULT 'MYR',
    
    preferred_seating_area_id UUID REFERENCES public.seating_areas(id) ON DELETE SET NULL,
    
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    
    booking_lead_minutes INTEGER CHECK (booking_lead_minutes IS NULL OR booking_lead_minutes >= 0),
    
    guest_terms TEXT,
    internal_notes TEXT,
    
    image_url TEXT,
    
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_exp_dates CHECK (
        valid_from IS NULL OR valid_until IS NULL OR valid_until >= valid_from
    )
);

-- 2. Create experience_addons Table
CREATE TABLE IF NOT EXISTS public.experience_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE, -- NULL = Org-wide catalogue
    
    experience_id UUID REFERENCES public.experiences(id) ON DELETE SET NULL, -- Specific experience or generic add-on
    
    name TEXT NOT NULL,
    description TEXT,
    
    category TEXT NOT NULL DEFAULT 'other' CHECK (
        category IN (
            'food',
            'beverage',
            'decor',
            'celebration',
            'personalization',
            'service',
            'other'
        )
    ),
    
    price NUMERIC(10, 2) CHECK (price IS NULL OR price >= 0),
    currency_code TEXT NOT NULL DEFAULT 'MYR',
    
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    maximum_quantity INTEGER CHECK (maximum_quantity IS NULL OR maximum_quantity > 0),
    
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create offers Table
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE, -- NULL = Org-wide catalogue
    
    title TEXT NOT NULL,
    short_description TEXT,
    description TEXT,
    
    status TEXT NOT NULL DEFAULT 'draft' CHECK (
        status IN ('draft', 'active', 'paused', 'expired', 'archived')
    ),
    
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    
    experience_id UUID REFERENCES public.experiences(id) ON DELETE SET NULL,
    
    eligibility_notes TEXT,
    redemption_notes TEXT,
    internal_notes TEXT,
    
    image_url TEXT,
    
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_offer_dates CHECK (
        valid_from IS NULL OR valid_until IS NULL OR valid_until >= valid_from
    )
);

-- 4. Create experience_availability_rules Table
CREATE TABLE IF NOT EXISTS public.experience_availability_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE,
    experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
    
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    maximum_bookings INTEGER CHECK (maximum_bookings IS NULL OR maximum_bookings > 0),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_rule_times CHECK (end_time > start_time)
);

-- 5. Create reservation_experiences Table (Junction / Operational Attachment)
CREATE TABLE IF NOT EXISTS public.reservation_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
    
    reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
    experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE RESTRICT,
    
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (
        status IN ('pending', 'confirmed', 'fulfilled', 'cancelled')
    ),
    
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    
    unit_price_snapshot NUMERIC(10, 2) CHECK (unit_price_snapshot IS NULL OR unit_price_snapshot >= 0),
    currency_code TEXT NOT NULL DEFAULT 'MYR',
    
    guest_notes TEXT,
    staff_notes TEXT,
    
    added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure 1 active experience attachment per reservation
    CONSTRAINT uq_reservation_active_experience UNIQUE (reservation_id, experience_id)
);

-- 6. Create reservation_addons Table
CREATE TABLE IF NOT EXISTS public.reservation_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
    
    reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
    experience_id UUID REFERENCES public.experiences(id) ON DELETE SET NULL,
    addon_id UUID NOT NULL REFERENCES public.experience_addons(id) ON DELETE RESTRICT,
    
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    
    unit_price_snapshot NUMERIC(10, 2) CHECK (unit_price_snapshot IS NULL OR unit_price_snapshot >= 0),
    currency_code TEXT NOT NULL DEFAULT 'MYR',
    
    notes TEXT,
    
    added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 7. Multi-Tenant Consistency & Validation Triggers
-- ==============================================================================

-- 7.1: Experience Seating Area Consistency
CREATE OR REPLACE FUNCTION public.check_experience_integrity()
RETURNS TRIGGER AS $$
DECLARE
    v_area_org UUID;
    v_area_outlet UUID;
BEGIN
    IF NEW.preferred_seating_area_id IS NOT NULL THEN
        SELECT organization_id, outlet_id INTO v_area_org, v_area_outlet
        FROM public.seating_areas
        WHERE id = NEW.preferred_seating_area_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Referenced seating area % does not exist', NEW.preferred_seating_area_id
                USING ERRCODE = '23503';
        END IF;

        IF v_area_org <> NEW.organization_id THEN
            RAISE EXCEPTION 'Cross-tenant seating area rejected: Area org (%) does not match Experience org (%)',
                v_area_org, NEW.organization_id
                USING ERRCODE = '23514';
        END IF;

        IF NEW.outlet_id IS NOT NULL AND v_area_outlet <> NEW.outlet_id THEN
            RAISE EXCEPTION 'Seating area % belongs to outlet %, but experience is scoped to outlet %',
                NEW.preferred_seating_area_id, v_area_outlet, NEW.outlet_id
                USING ERRCODE = '23514';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_experience ON public.experiences;
CREATE TRIGGER trg_check_experience
    BEFORE INSERT OR UPDATE OF organization_id, outlet_id, preferred_seating_area_id
    ON public.experiences
    FOR EACH ROW
    EXECUTE FUNCTION public.check_experience_integrity();

-- 7.2: Experience Addon Integrity
CREATE OR REPLACE FUNCTION public.check_addon_integrity()
RETURNS TRIGGER AS $$
DECLARE
    v_exp_org UUID;
    v_exp_outlet UUID;
BEGIN
    IF NEW.experience_id IS NOT NULL THEN
        SELECT organization_id, outlet_id INTO v_exp_org, v_exp_outlet
        FROM public.experiences
        WHERE id = NEW.experience_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Referenced experience % does not exist', NEW.experience_id
                USING ERRCODE = '23503';
        END IF;

        IF v_exp_org <> NEW.organization_id THEN
            RAISE EXCEPTION 'Addon org (%) does not match parent experience org (%)',
                NEW.organization_id, v_exp_org
                USING ERRCODE = '23514';
        END IF;

        IF NEW.outlet_id IS NOT NULL AND v_exp_outlet IS NOT NULL AND NEW.outlet_id <> v_exp_outlet THEN
            RAISE EXCEPTION 'Addon outlet (%) does not match experience outlet (%)',
                NEW.outlet_id, v_exp_outlet
                USING ERRCODE = '23514';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_addon ON public.experience_addons;
CREATE TRIGGER trg_check_addon
    BEFORE INSERT OR UPDATE OF organization_id, outlet_id, experience_id
    ON public.experience_addons
    FOR EACH ROW
    EXECUTE FUNCTION public.check_addon_integrity();

-- 7.3: Offer Integrity
CREATE OR REPLACE FUNCTION public.check_offer_integrity()
RETURNS TRIGGER AS $$
DECLARE
    v_exp_org UUID;
BEGIN
    IF NEW.experience_id IS NOT NULL THEN
        SELECT organization_id INTO v_exp_org
        FROM public.experiences
        WHERE id = NEW.experience_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Referenced experience % does not exist', NEW.experience_id
                USING ERRCODE = '23503';
        END IF;

        IF v_exp_org <> NEW.organization_id THEN
            RAISE EXCEPTION 'Offer org (%) does not match linked experience org (%)',
                NEW.organization_id, v_exp_org
                USING ERRCODE = '23514';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_offer ON public.offers;
CREATE TRIGGER trg_check_offer
    BEFORE INSERT OR UPDATE OF organization_id, outlet_id, experience_id
    ON public.offers
    FOR EACH ROW
    EXECUTE FUNCTION public.check_offer_integrity();

-- 7.4: Reservation Experience Consistency
CREATE OR REPLACE FUNCTION public.check_reservation_experience_consistency()
RETURNS TRIGGER AS $$
DECLARE
    v_res_org UUID;
    v_res_outlet UUID;
    v_exp_org UUID;
    v_exp_outlet UUID;
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

    -- Validate Experience
    SELECT organization_id, outlet_id INTO v_exp_org, v_exp_outlet
    FROM public.experiences
    WHERE id = NEW.experience_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Referenced experience % does not exist', NEW.experience_id
            USING ERRCODE = '23503';
    END IF;

    IF v_exp_org <> NEW.organization_id THEN
        RAISE EXCEPTION 'Experience org (%) does not match attachment org (%)',
            v_exp_org, NEW.organization_id
            USING ERRCODE = '23514';
    END IF;

    IF v_exp_outlet IS NOT NULL AND v_exp_outlet <> NEW.outlet_id THEN
        RAISE EXCEPTION 'Experience scoped to outlet %, cannot attach to reservation in outlet %',
            v_exp_outlet, NEW.outlet_id
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_reservation_experience ON public.reservation_experiences;
CREATE TRIGGER trg_check_reservation_experience
    BEFORE INSERT OR UPDATE OF organization_id, outlet_id, reservation_id, experience_id
    ON public.reservation_experiences
    FOR EACH ROW
    EXECUTE FUNCTION public.check_reservation_experience_consistency();

-- 7.5: Reservation Addon Consistency
CREATE OR REPLACE FUNCTION public.check_reservation_addon_consistency()
RETURNS TRIGGER AS $$
DECLARE
    v_res_org UUID;
    v_res_outlet UUID;
    v_addon_org UUID;
    v_addon_outlet UUID;
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
    SELECT organization_id, outlet_id INTO v_addon_org, v_addon_outlet
    FROM public.experience_addons
    WHERE id = NEW.addon_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Referenced addon % does not exist', NEW.addon_id
            USING ERRCODE = '23503';
    END IF;

    IF v_addon_org <> NEW.organization_id THEN
        RAISE EXCEPTION 'Addon org (%) does not match attachment org (%)',
            v_addon_org, NEW.organization_id
            USING ERRCODE = '23514';
    END IF;

    IF v_addon_outlet IS NOT NULL AND v_addon_outlet <> NEW.outlet_id THEN
        RAISE EXCEPTION 'Addon scoped to outlet %, cannot attach to reservation in outlet %',
            v_addon_outlet, NEW.outlet_id
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_reservation_addon ON public.reservation_addons;
CREATE TRIGGER trg_check_reservation_addon
    BEFORE INSERT OR UPDATE OF organization_id, outlet_id, reservation_id, addon_id
    ON public.reservation_addons
    FOR EACH ROW
    EXECUTE FUNCTION public.check_reservation_addon_consistency();

-- ==============================================================================
-- 8. Indexes for High-Performance Queries
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_experiences_org_status
    ON public.experiences(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_experiences_outlet
    ON public.experiences(outlet_id)
    WHERE outlet_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_experiences_category
    ON public.experiences(category);

CREATE INDEX IF NOT EXISTS idx_experience_addons_org
    ON public.experience_addons(organization_id, is_active);

CREATE INDEX IF NOT EXISTS idx_experience_addons_exp
    ON public.experience_addons(experience_id)
    WHERE experience_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_offers_org_status
    ON public.offers(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_exp_avail_rules_exp
    ON public.experience_availability_rules(experience_id, day_of_week);

CREATE INDEX IF NOT EXISTS idx_res_exp_res
    ON public.reservation_experiences(reservation_id);

CREATE INDEX IF NOT EXISTS idx_res_exp_exp
    ON public.reservation_experiences(experience_id);

CREATE INDEX IF NOT EXISTS idx_res_addons_res
    ON public.reservation_addons(reservation_id);

CREATE INDEX IF NOT EXISTS idx_res_addons_addon
    ON public.reservation_addons(addon_id);

-- ==============================================================================
-- 9. Row Level Security Policies
-- ==============================================================================
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_addons ENABLE ROW LEVEL SECURITY;

-- 9.1: Experiences RLS
-- Allows org-wide catalogue items (outlet_id IS NULL) or outlet-specific items
CREATE POLICY "experiences_access"
    ON public.experiences
    FOR ALL
    USING (
        (outlet_id IS NULL AND public.has_organization_access(auth.uid(), organization_id))
        OR
        (outlet_id IS NOT NULL AND public.has_outlet_access(auth.uid(), organization_id, outlet_id))
    )
    WITH CHECK (
        (outlet_id IS NULL AND public.has_organization_access(auth.uid(), organization_id))
        OR
        (outlet_id IS NOT NULL AND public.has_outlet_access(auth.uid(), organization_id, outlet_id))
    );

-- 9.2: Experience Add-ons RLS
CREATE POLICY "experience_addons_access"
    ON public.experience_addons
    FOR ALL
    USING (
        (outlet_id IS NULL AND public.has_organization_access(auth.uid(), organization_id))
        OR
        (outlet_id IS NOT NULL AND public.has_outlet_access(auth.uid(), organization_id, outlet_id))
    )
    WITH CHECK (
        (outlet_id IS NULL AND public.has_organization_access(auth.uid(), organization_id))
        OR
        (outlet_id IS NOT NULL AND public.has_outlet_access(auth.uid(), organization_id, outlet_id))
    );

-- 9.3: Offers RLS
CREATE POLICY "offers_access"
    ON public.offers
    FOR ALL
    USING (
        (outlet_id IS NULL AND public.has_organization_access(auth.uid(), organization_id))
        OR
        (outlet_id IS NOT NULL AND public.has_outlet_access(auth.uid(), organization_id, outlet_id))
    )
    WITH CHECK (
        (outlet_id IS NULL AND public.has_organization_access(auth.uid(), organization_id))
        OR
        (outlet_id IS NOT NULL AND public.has_outlet_access(auth.uid(), organization_id, outlet_id))
    );

-- 9.4: Availability Rules RLS
CREATE POLICY "exp_avail_rules_access"
    ON public.experience_availability_rules
    FOR ALL
    USING (
        (outlet_id IS NULL AND public.has_organization_access(auth.uid(), organization_id))
        OR
        (outlet_id IS NOT NULL AND public.has_outlet_access(auth.uid(), organization_id, outlet_id))
    )
    WITH CHECK (
        (outlet_id IS NULL AND public.has_organization_access(auth.uid(), organization_id))
        OR
        (outlet_id IS NOT NULL AND public.has_outlet_access(auth.uid(), organization_id, outlet_id))
    );

-- 9.5: Reservation Experiences Operational RLS (strictly outlet-scoped)
CREATE POLICY "res_experiences_access"
    ON public.reservation_experiences
    FOR ALL
    USING (public.has_outlet_access(auth.uid(), organization_id, outlet_id))
    WITH CHECK (public.has_outlet_access(auth.uid(), organization_id, outlet_id));

-- 9.6: Reservation Add-ons Operational RLS (strictly outlet-scoped)
CREATE POLICY "res_addons_access"
    ON public.reservation_addons
    FOR ALL
    USING (public.has_outlet_access(auth.uid(), organization_id, outlet_id))
    WITH CHECK (public.has_outlet_access(auth.uid(), organization_id, outlet_id));
