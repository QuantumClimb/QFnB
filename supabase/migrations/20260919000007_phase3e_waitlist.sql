-- ==============================================================================
-- Migration: 20260919000007_phase3e_waitlist.sql
-- Description: Phase 3E - Operational Waitlist & Queue Schema (LOCAL ONLY)
-- Strict Constraints: Multi-tenant scoped, tenant triggers, secure tokens, audit history
-- DO NOT APPLY REMOTELY
-- ==============================================================================

-- 1. Create Waitlist Enums
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'waitlist_status_enum') THEN
        CREATE TYPE public.waitlist_status_enum AS ENUM (
            'waiting',
            'notified',
            'arrived',
            'table_preparing',
            'ready',
            'seated',
            'cancelled',
            'no_response'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'waitlist_source_enum') THEN
        CREATE TYPE public.waitlist_source_enum AS ENUM (
            'staff',
            'walk_in',
            'q_restobar',
            'website',
            'whatsapp',
            'hotel_concierge',
            'other'
        );
    END IF;
END $$;

-- 2. Create waitlist_entries Table
CREATE TABLE IF NOT EXISTS public.waitlist_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
    
    -- CRM linkage (nullable UUID without strict FK for Phase 3G guest CRM)
    guest_id UUID,
    
    guest_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT,
    
    party_size INTEGER NOT NULL CHECK (party_size > 0),
    
    preferred_seating_area_id UUID REFERENCES public.seating_areas(id) ON DELETE SET NULL,
    
    quoted_wait_minutes INTEGER NOT NULL DEFAULT 15 CHECK (quoted_wait_minutes >= 0),
    estimated_wait_minutes INTEGER NOT NULL DEFAULT 15 CHECK (estimated_wait_minutes >= 0),
    
    status public.waitlist_status_enum NOT NULL DEFAULT 'waiting',
    queue_number TEXT NOT NULL,
    
    notes TEXT,
    special_occasion TEXT,
    dietary_requirements TEXT[],
    allergies TEXT[],
    priority_tags TEXT[],
    
    source public.waitlist_source_enum NOT NULL DEFAULT 'walk_in',
    
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notified_at TIMESTAMPTZ,
    arrived_at TIMESTAMPTZ,
    seated_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    assigned_table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
    
    guest_status_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create waitlist_status_history Table
CREATE TABLE IF NOT EXISTS public.waitlist_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
    waitlist_entry_id UUID NOT NULL REFERENCES public.waitlist_entries(id) ON DELETE CASCADE,
    
    old_status public.waitlist_status_enum,
    new_status public.waitlist_status_enum NOT NULL,
    
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    note TEXT
);

-- 4. Database-Side Tenant Consistency Triggers

-- Trigger 4.1: Validate Preferred Seating Area Tenancy
CREATE OR REPLACE FUNCTION public.check_waitlist_preferred_area_consistency()
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
            RAISE EXCEPTION 'Referenced seating_area does not exist'
                USING ERRCODE = '23503';
        END IF;

        IF v_area_org <> NEW.organization_id OR v_area_outlet <> NEW.outlet_id THEN
            RAISE EXCEPTION 'Cross-tenant seating area assignment rejected: Area (%, %) does not match Waitlist Entry (%, %)',
                v_area_org, v_area_outlet, NEW.organization_id, NEW.outlet_id
                USING ERRCODE = '23514';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_waitlist_preferred_area ON public.waitlist_entries;
CREATE TRIGGER trg_check_waitlist_preferred_area
    BEFORE INSERT OR UPDATE OF preferred_seating_area_id, organization_id, outlet_id
    ON public.waitlist_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.check_waitlist_preferred_area_consistency();

-- Trigger 4.2: Validate Assigned Table Tenancy
CREATE OR REPLACE FUNCTION public.check_waitlist_assigned_table_consistency()
RETURNS TRIGGER AS $$
DECLARE
    v_table_org UUID;
    v_table_outlet UUID;
BEGIN
    IF NEW.assigned_table_id IS NOT NULL THEN
        SELECT organization_id, outlet_id INTO v_table_org, v_table_outlet
        FROM public.restaurant_tables
        WHERE id = NEW.assigned_table_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Referenced restaurant_table does not exist'
                USING ERRCODE = '23503';
        END IF;

        IF v_table_org <> NEW.organization_id OR v_table_outlet <> NEW.outlet_id THEN
            RAISE EXCEPTION 'Cross-tenant table assignment rejected: Table (%, %) does not match Waitlist Entry (%, %)',
                v_table_org, v_table_outlet, NEW.organization_id, NEW.outlet_id
                USING ERRCODE = '23514';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_waitlist_assigned_table ON public.waitlist_entries;
CREATE TRIGGER trg_check_waitlist_assigned_table
    BEFORE INSERT OR UPDATE OF assigned_table_id, organization_id, outlet_id
    ON public.waitlist_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.check_waitlist_assigned_table_consistency();

-- Trigger 4.3: Validate Reservation Tenancy
CREATE OR REPLACE FUNCTION public.check_waitlist_reservation_consistency()
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
            RAISE EXCEPTION 'Cross-tenant reservation linkage rejected: Reservation (%, %) does not match Waitlist Entry (%, %)',
                v_res_org, v_res_outlet, NEW.organization_id, NEW.outlet_id
                USING ERRCODE = '23514';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_waitlist_reservation ON public.waitlist_entries;
CREATE TRIGGER trg_check_waitlist_reservation
    BEFORE INSERT OR UPDATE OF reservation_id, organization_id, outlet_id
    ON public.waitlist_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.check_waitlist_reservation_consistency();

-- Trigger 4.4: Validate Waitlist Status History Tenancy
CREATE OR REPLACE FUNCTION public.check_waitlist_status_history_consistency()
RETURNS TRIGGER AS $$
DECLARE
    v_entry_org UUID;
    v_entry_outlet UUID;
BEGIN
    SELECT organization_id, outlet_id INTO v_entry_org, v_entry_outlet
    FROM public.waitlist_entries
    WHERE id = NEW.waitlist_entry_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Referenced waitlist_entry does not exist'
            USING ERRCODE = '23503';
    END IF;

    IF v_entry_org <> NEW.organization_id OR v_entry_outlet <> NEW.outlet_id THEN
        RAISE EXCEPTION 'Cross-tenant status history rejected: Waitlist Entry (%, %) does not match Status History record (%, %)',
            v_entry_org, v_entry_outlet, NEW.organization_id, NEW.outlet_id
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_waitlist_status_history ON public.waitlist_status_history;
CREATE TRIGGER trg_check_waitlist_status_history
    BEFORE INSERT OR UPDATE OF waitlist_entry_id, organization_id, outlet_id
    ON public.waitlist_status_history
    FOR EACH ROW
    EXECUTE FUNCTION public.check_waitlist_status_history_consistency();

-- 5. Create Indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_outlet_status_joined
    ON public.waitlist_entries(outlet_id, status, joined_at);

CREATE INDEX IF NOT EXISTS idx_waitlist_outlet_phone
    ON public.waitlist_entries(outlet_id, phone);

CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_guest_status_token
    ON public.waitlist_entries(guest_status_token);

CREATE INDEX IF NOT EXISTS idx_waitlist_history_entry
    ON public.waitlist_status_history(waitlist_entry_id, changed_at);

-- 6. Row Level Security Policies
ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waitlist_entries_tenant_isolation" ON public.waitlist_entries;
CREATE POLICY "waitlist_entries_tenant_isolation"
    ON public.waitlist_entries
    FOR ALL
    USING (public.has_outlet_access(auth.uid(), organization_id, outlet_id))
    WITH CHECK (public.has_outlet_access(auth.uid(), organization_id, outlet_id));

DROP POLICY IF EXISTS "waitlist_status_history_tenant_isolation" ON public.waitlist_status_history;
CREATE POLICY "waitlist_status_history_tenant_isolation"
    ON public.waitlist_status_history
    FOR ALL
    USING (public.has_outlet_access(auth.uid(), organization_id, outlet_id))
    WITH CHECK (public.has_outlet_access(auth.uid(), organization_id, outlet_id));
