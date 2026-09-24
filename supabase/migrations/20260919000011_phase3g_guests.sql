-- ==============================================================================
-- Migration: 20260919000011_phase3g_guests.sql
-- Description: Phase 3G - Hospitality Guest Profiles, Visits, Preferences & CRM (LOCAL ONLY)
-- Strict Constraints:
-- 1. Organization-scoped guest identity (cross-outlet recognition)
-- 2. Outlet-scoped guest visits timeline
-- 3. Contact normalization triggers (phone, WhatsApp, email)
-- 4. Foreign key connections: reservations.guest_id, waitlist_entries.guest_id, orders.guest_id -> guests.id
-- 5. Tenant consistency triggers across reservations, waitlist, orders, and visits
-- 6. RLS policies with public.has_outlet_access() and organization membership
-- DO NOT APPLY REMOTELY
-- ==============================================================================

-- 1. Create guests Table
CREATE TABLE IF NOT EXISTS public.guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    display_name TEXT,
    
    phone TEXT,
    phone_normalized TEXT,
    
    whatsapp TEXT,
    whatsapp_normalized TEXT,
    
    email TEXT,
    email_normalized TEXT,
    
    date_of_birth DATE,
    anniversary_date DATE,
    
    preferred_language TEXT DEFAULT 'en',
    
    preferred_outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
    preferred_seating_area_id UUID REFERENCES public.seating_areas(id) ON DELETE SET NULL,
    preferred_table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
    
    dietary_requirements TEXT[] DEFAULT '{}',
    allergies TEXT[] DEFAULT '{}',
    
    hospitality_notes TEXT,
    tags TEXT[] DEFAULT '{}',
    
    visit_count INTEGER NOT NULL DEFAULT 0 CHECK (visit_count >= 0),
    first_visit_at TIMESTAMPTZ,
    last_visit_at TIMESTAMPTZ,
    last_reservation_at TIMESTAMPTZ,
    
    is_vip BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    marketing_email_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
    marketing_whatsapp_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
    marketing_sms_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create guest_visits Table
CREATE TABLE IF NOT EXISTS public.guest_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
    
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    arrival_at TIMESTAMPTZ,
    seated_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    party_size INTEGER CHECK (party_size > 0),
    seating_area_id UUID REFERENCES public.seating_areas(id) ON DELETE SET NULL,
    table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
    
    occasion TEXT,
    service_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Add Foreign Keys from Reservations, Waitlist, and Orders to guests
-- Reservations -> guests (replacing unconstrained UUID from Phase 3C)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_reservations_guest'
    ) THEN
        ALTER TABLE public.reservations
            ADD CONSTRAINT fk_reservations_guest
            FOREIGN KEY (guest_id)
            REFERENCES public.guests(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- Waitlist -> guests
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_waitlist_guest'
    ) THEN
        ALTER TABLE public.waitlist_entries
            ADD CONSTRAINT fk_waitlist_guest
            FOREIGN KEY (guest_id)
            REFERENCES public.guests(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- Orders -> guests (add column if not present)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'orders' 
          AND column_name = 'guest_id'
    ) THEN
        ALTER TABLE public.orders 
            ADD COLUMN guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Contact Normalization Helper & Trigger
CREATE OR REPLACE FUNCTION public.normalize_contact_string(p_val TEXT, p_type TEXT)
RETURNS TEXT AS $$
DECLARE
    v_cleaned TEXT;
BEGIN
    IF p_val IS NULL OR TRIM(p_val) = '' THEN
        RETURN NULL;
    END IF;

    IF p_type = 'email' THEN
        RETURN LOWER(TRIM(p_val));
    ELSIF p_type IN ('phone', 'whatsapp') THEN
        -- Strip non-digit characters except leading plus
        v_cleaned := REGEXP_REPLACE(p_val, '[^0-9+]', '', 'g');
        -- If no plus prefix, ensure consistent digit string
        RETURN TRIM(v_cleaned);
    ELSE
        RETURN TRIM(p_val);
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.trg_normalize_guest_contacts()
RETURNS TRIGGER AS $$
BEGIN
    NEW.phone_normalized := public.normalize_contact_string(NEW.phone, 'phone');
    NEW.whatsapp_normalized := public.normalize_contact_string(NEW.whatsapp, 'whatsapp');
    NEW.email_normalized := public.normalize_contact_string(NEW.email, 'email');
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guests_normalize_contacts ON public.guests;
CREATE TRIGGER trg_guests_normalize_contacts
    BEFORE INSERT OR UPDATE OF phone, whatsapp, email
    ON public.guests
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_normalize_guest_contacts();

-- 5. Tenant Consistency Triggers

-- 5.1: Reservation -> Guest Tenant Consistency
CREATE OR REPLACE FUNCTION public.check_reservation_guest_consistency()
RETURNS TRIGGER AS $$
DECLARE
    v_guest_org UUID;
BEGIN
    IF NEW.guest_id IS NOT NULL THEN
        SELECT organization_id INTO v_guest_org
        FROM public.guests
        WHERE id = NEW.guest_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Referenced guest % does not exist', NEW.guest_id
                USING ERRCODE = '23503';
        END IF;

        IF v_guest_org <> NEW.organization_id THEN
            RAISE EXCEPTION 'Cross-tenant guest assignment rejected: Guest org (%) does not match Reservation org (%)',
                v_guest_org, NEW.organization_id
                USING ERRCODE = '23514';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_reservation_guest ON public.reservations;
CREATE TRIGGER trg_check_reservation_guest
    BEFORE INSERT OR UPDATE OF guest_id, organization_id
    ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION public.check_reservation_guest_consistency();

-- 5.2: Waitlist -> Guest Tenant Consistency
CREATE OR REPLACE FUNCTION public.check_waitlist_guest_consistency()
RETURNS TRIGGER AS $$
DECLARE
    v_guest_org UUID;
BEGIN
    IF NEW.guest_id IS NOT NULL THEN
        SELECT organization_id INTO v_guest_org
        FROM public.guests
        WHERE id = NEW.guest_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Referenced guest % does not exist', NEW.guest_id
                USING ERRCODE = '23503';
        END IF;

        IF v_guest_org <> NEW.organization_id THEN
            RAISE EXCEPTION 'Cross-tenant guest assignment rejected: Guest org (%) does not match Waitlist org (%)',
                v_guest_org, NEW.organization_id
                USING ERRCODE = '23514';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_waitlist_guest ON public.waitlist_entries;
CREATE TRIGGER trg_check_waitlist_guest
    BEFORE INSERT OR UPDATE OF guest_id, organization_id
    ON public.waitlist_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.check_waitlist_guest_consistency();

-- 5.3: Order -> Guest Tenant Consistency
CREATE OR REPLACE FUNCTION public.check_order_guest_consistency()
RETURNS TRIGGER AS $$
DECLARE
    v_guest_org UUID;
BEGIN
    IF NEW.guest_id IS NOT NULL THEN
        SELECT organization_id INTO v_guest_org
        FROM public.guests
        WHERE id = NEW.guest_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Referenced guest % does not exist', NEW.guest_id
                USING ERRCODE = '23503';
        END IF;

        IF v_guest_org <> NEW.organization_id THEN
            RAISE EXCEPTION 'Cross-tenant guest assignment rejected: Guest org (%) does not match Order org (%)',
                v_guest_org, NEW.organization_id
                USING ERRCODE = '23514';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_order_guest ON public.orders;
CREATE TRIGGER trg_check_order_guest
    BEFORE INSERT OR UPDATE OF guest_id, organization_id
    ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.check_order_guest_consistency();

-- 5.4: Guest Visit Multi-Tenant Consistency
CREATE OR REPLACE FUNCTION public.check_guest_visit_consistency()
RETURNS TRIGGER AS $$
DECLARE
    v_guest_org UUID;
    v_outlet_org UUID;
    v_table_outlet UUID;
BEGIN
    -- Validate guest tenant
    SELECT organization_id INTO v_guest_org
    FROM public.guests
    WHERE id = NEW.guest_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Referenced guest % does not exist', NEW.guest_id
            USING ERRCODE = '23503';
    END IF;

    IF v_guest_org <> NEW.organization_id THEN
        RAISE EXCEPTION 'Cross-tenant visit rejected: Guest org (%) does not match Visit org (%)',
            v_guest_org, NEW.organization_id
            USING ERRCODE = '23514';
    END IF;

    -- Validate outlet belongs to same org
    SELECT organization_id INTO v_outlet_org
    FROM public.outlets
    WHERE id = NEW.outlet_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Referenced outlet % does not exist', NEW.outlet_id
            USING ERRCODE = '23503';
    END IF;

    IF v_outlet_org <> NEW.organization_id THEN
        RAISE EXCEPTION 'Cross-tenant outlet rejected: Outlet org (%) does not match Visit org (%)',
            v_outlet_org, NEW.organization_id
            USING ERRCODE = '23514';
    END IF;

    -- Validate table if present
    IF NEW.table_id IS NOT NULL THEN
        SELECT outlet_id INTO v_table_outlet
        FROM public.restaurant_tables
        WHERE id = NEW.table_id;

        IF v_table_outlet <> NEW.outlet_id THEN
            RAISE EXCEPTION 'Table % does not belong to visit outlet %', NEW.table_id, NEW.outlet_id
                USING ERRCODE = '23514';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_guest_visit ON public.guest_visits;
CREATE TRIGGER trg_check_guest_visit
    BEFORE INSERT OR UPDATE OF guest_id, organization_id, outlet_id, table_id
    ON public.guest_visits
    FOR EACH ROW
    EXECUTE FUNCTION public.check_guest_visit_consistency();

-- 6. Indexes for High-Performance Hospitality Search & Duplicate Matching
CREATE INDEX IF NOT EXISTS idx_guests_org_active
    ON public.guests(organization_id, is_active);

CREATE INDEX IF NOT EXISTS idx_guests_phone_norm
    ON public.guests(organization_id, phone_normalized)
    WHERE phone_normalized IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_guests_whatsapp_norm
    ON public.guests(organization_id, whatsapp_normalized)
    WHERE whatsapp_normalized IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_guests_email_norm
    ON public.guests(organization_id, email_normalized)
    WHERE email_normalized IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_guests_name_search
    ON public.guests(organization_id, last_name, first_name);

CREATE INDEX IF NOT EXISTS idx_guest_visits_guest_date
    ON public.guest_visits(guest_id, visit_date DESC);

CREATE INDEX IF NOT EXISTS idx_guest_visits_outlet_date
    ON public.guest_visits(outlet_id, visit_date DESC);

-- 7. Row Level Security Policies
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_visits ENABLE ROW LEVEL SECURITY;

-- 7.1 Helper: Check if user has organization-level access
-- Staff belonging to the organization directly (owner, admin) OR assigned to ANY outlet
-- belonging to this organization are authorized to view and recognize organization guests.
CREATE OR REPLACE FUNCTION public.has_organization_access(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Direct organization member (owner, admin, etc.)
  IF EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- Operational staff assigned to any outlet within this organization
  RETURN EXISTS (
    SELECT 1 FROM public.outlet_members om
    JOIN public.outlets o ON o.id = om.outlet_id
    WHERE om.user_id = _user_id AND o.organization_id = _org_id
  );
END;
$$;

-- 7.2 Guests RLS: Organization-scoped visibility
-- Notice: guests has NO outlet_id column. It is scoped to organization_id.
-- Any authorized staff across the organization's outlets can recognize guests.
DROP POLICY IF EXISTS "guests_org_access" ON public.guests;
CREATE POLICY "guests_org_access"
    ON public.guests
    FOR ALL
    USING (public.has_organization_access(auth.uid(), organization_id))
    WITH CHECK (public.has_organization_access(auth.uid(), organization_id));

-- 7.3 Guest Visits RLS: Outlet-scoped operational access
-- Notice: guest_visits has BOTH organization_id and outlet_id.
-- Staff access is strictly validated via has_outlet_access().
DROP POLICY IF EXISTS "guest_visits_outlet_access" ON public.guest_visits;
CREATE POLICY "guest_visits_outlet_access"
    ON public.guest_visits
    FOR ALL
    USING (public.has_outlet_access(auth.uid(), organization_id, outlet_id))
    WITH CHECK (public.has_outlet_access(auth.uid(), organization_id, outlet_id));

