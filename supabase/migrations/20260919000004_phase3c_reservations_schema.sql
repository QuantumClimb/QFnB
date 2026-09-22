-- ====================================================================
-- Q F&B STANDALONE OPERATIONAL APPLICATION - MULTI-TENANT SQL SCHEMA
-- Phase 3C.1 Hardened: Reservations, Seating Areas, Status History & RLS
-- ====================================================================

-- 1. Custom Enums for Reservation Lifecycle & Channels
DO $$ BEGIN
  CREATE TYPE public.reservation_status_enum AS ENUM (
    'new',
    'contacted',
    'confirmed',
    'arrived',
    'seated',
    'completed',
    'cancelled',
    'no_show'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.booking_source_enum AS ENUM (
    'staff',
    'phone',
    'whatsapp',
    'walk_in',
    'website',
    'q_restobar',
    'hotel_concierge',
    'google',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.deposit_status_enum AS ENUM (
    'not_required',
    'pending',
    'paid',
    'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Seating Areas Table
CREATE TABLE IF NOT EXISTS public.seating_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  capacity INT DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  display_order INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Reservations Core Table
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  
  -- Guest Identifier (Nullable UUID with NO foreign key in Phase 3C; links to guests.id in Phase 3G)
  guest_id UUID, 
  
  -- Guest Contact Details (Denormalized for immediate host response & multi-channel sync)
  guest_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,

  -- Schedule & Party
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  party_size INT NOT NULL CHECK (party_size > 0),

  -- Location & Allocation
  seating_area_id UUID REFERENCES public.seating_areas(id) ON DELETE SET NULL,
  assigned_table_id UUID, -- References future restaurant_tables.id (Phase 3D)

  -- Lifecycle & Channel
  booking_source public.booking_source_enum DEFAULT 'staff' NOT NULL,
  status public.reservation_status_enum DEFAULT 'new' NOT NULL,

  -- Hospitality Preferences
  special_occasion TEXT,
  special_requests TEXT,
  dietary_requirements TEXT,
  allergies TEXT,

  -- Pacing & Turnaround
  expected_duration_minutes INT DEFAULT 90 NOT NULL,

  -- Financials / Deposits
  deposit_status public.deposit_status_enum DEFAULT 'not_required' NOT NULL,
  deposit_amount NUMERIC(10, 2) DEFAULT 0.00,

  -- External Interoperability & Secure Tokenization
  external_reference TEXT,
  external_request_id TEXT, -- Idempotency key for duplicate submission prevention
  reservation_token TEXT UNIQUE DEFAULT gen_random_uuid()::text NOT NULL,

  -- Audit & Metadata
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Nullable for external/automated bookings
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Status History Table for Auditing Lifecycle Transitions
CREATE TABLE IF NOT EXISTS public.reservation_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  old_status public.reservation_status_enum,
  new_status public.reservation_status_enum NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Nullable for automated events (Q RESTOBAR, Edge Functions)
  changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  note TEXT
);

-- 5. Performance & Idempotency Indexes
CREATE INDEX IF NOT EXISTS idx_reservations_outlet_date_time 
  ON public.reservations (outlet_id, reservation_date, reservation_time);

CREATE INDEX IF NOT EXISTS idx_reservations_outlet_status 
  ON public.reservations (outlet_id, status);

CREATE INDEX IF NOT EXISTS idx_reservations_token 
  ON public.reservations (reservation_token);

-- External Idempotency Protection: Prevents duplicate creation on repeated API submissions
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_idempotency 
  ON public.reservations (outlet_id, external_request_id) 
  WHERE external_request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reservation_history_res_id 
  ON public.reservation_status_history (reservation_id, changed_at DESC);

-- 6. Organization & Outlet Consistency Validation Trigger
-- SECURITY JUSTIFICATION: Enforces cross-table integrity preventing organization_id & outlet_id mismatch
CREATE OR REPLACE FUNCTION public.check_outlet_organization_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.outlets
    WHERE id = NEW.outlet_id AND organization_id = NEW.organization_id
  ) THEN
    RAISE EXCEPTION 'Integrity Error: Outlet % does not belong to Organization %', NEW.outlet_id, NEW.organization_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_seating_area_org ON public.seating_areas;
CREATE TRIGGER trg_validate_seating_area_org
  BEFORE INSERT OR UPDATE ON public.seating_areas
  FOR EACH ROW EXECUTE FUNCTION public.check_outlet_organization_consistency();

DROP TRIGGER IF EXISTS trg_validate_reservation_org ON public.reservations;
CREATE TRIGGER trg_validate_reservation_org
  BEFORE INSERT OR UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.check_outlet_organization_consistency();

-- 7. Security Definer Helper Functions for Scoped Access
-- Helper: Check if user has outlet access (either Org Owner/Admin OR assigned in outlet_members)
CREATE OR REPLACE FUNCTION public.has_outlet_access(_user_id UUID, _org_id UUID, _outlet_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Org Owners and Admins have global access to all outlets within their organization
  IF EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id 
      AND organization_id = _org_id 
      AND role IN ('owner', 'admin')
  ) THEN
    RETURN TRUE;
  END IF;

  -- Operational staff must have explicit assignment in outlet_members
  RETURN EXISTS (
    SELECT 1 FROM public.outlet_members
    WHERE user_id = _user_id AND outlet_id = _outlet_id
  );
END;
$$;

-- 8. Row Level Security (RLS) Policies
ALTER TABLE public.seating_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_status_history ENABLE ROW LEVEL SECURITY;

-- Seating Areas RLS
DROP POLICY IF EXISTS "Staff can view seating areas for their assigned outlets" ON public.seating_areas;
CREATE POLICY "Staff can view seating areas for their assigned outlets"
  ON public.seating_areas
  FOR SELECT
  USING (
    public.has_outlet_access(auth.uid(), organization_id, outlet_id)
  );

DROP POLICY IF EXISTS "Managers and Admins can manage seating areas" ON public.seating_areas;
CREATE POLICY "Managers and Admins can manage seating areas"
  ON public.seating_areas
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE user_id = auth.uid() 
        AND organization_id = seating_areas.organization_id 
        AND role IN ('owner', 'admin', 'manager')
    ) OR EXISTS (
      SELECT 1 FROM public.outlet_members
      WHERE user_id = auth.uid()
        AND outlet_id = seating_areas.outlet_id
        AND role IN ('owner', 'admin', 'manager')
    )
  );

-- Reservations RLS
DROP POLICY IF EXISTS "Staff can view reservations for their assigned outlets" ON public.reservations;
CREATE POLICY "Staff can view reservations for their assigned outlets"
  ON public.reservations
  FOR SELECT
  USING (
    public.has_outlet_access(auth.uid(), organization_id, outlet_id)
  );

DROP POLICY IF EXISTS "Staff can create and manage reservations for their assigned outlets" ON public.reservations;
CREATE POLICY "Staff can create and manage reservations for their assigned outlets"
  ON public.reservations
  FOR ALL
  USING (
    public.has_outlet_access(auth.uid(), organization_id, outlet_id)
  );

-- Reservation Status History RLS
DROP POLICY IF EXISTS "Staff can view history for their assigned outlet reservations" ON public.reservation_status_history;
CREATE POLICY "Staff can view history for their assigned outlet reservations"
  ON public.reservation_status_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.id = reservation_status_history.reservation_id
        AND public.has_outlet_access(auth.uid(), r.organization_id, r.outlet_id)
    )
  );

DROP POLICY IF EXISTS "Staff can record reservation history for their assigned outlets" ON public.reservation_status_history;
CREATE POLICY "Staff can record reservation history for their assigned outlets"
  ON public.reservation_status_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.id = reservation_status_history.reservation_id
        AND public.has_outlet_access(auth.uid(), r.organization_id, r.outlet_id)
    )
  );
