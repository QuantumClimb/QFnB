-- ====================================================================
-- Q F&B STANDALONE OPERATIONAL APPLICATION - MULTI-TENANT SQL SCHEMA
-- Phase 3D: Floor Management, Restaurant Tables, State History & Smart Availability
-- ====================================================================

-- 1. Custom Enums for Table State Lifecycle & Geometric Shapes
DO $$ BEGIN
  CREATE TYPE public.table_status_enum AS ENUM (
    'available',
    'reserved',
    'arriving',
    'seated',
    'ordering',
    'dining',
    'bill_requested',
    'cleaning',
    'blocked'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.table_shape_enum AS ENUM (
    'round',
    'square',
    'rectangle',
    'booth',
    'bar'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Restaurant Tables Table
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  seating_area_id UUID NOT NULL REFERENCES public.seating_areas(id) ON DELETE CASCADE,

  -- Identification
  table_number VARCHAR(20) NOT NULL, -- e.g. 'T01', 'B-03', 'PDR-1'
  display_name TEXT, -- e.g. 'Window Booth', 'Chef Counter 1'

  -- Capacity Bounds
  capacity INT NOT NULL CHECK (capacity > 0),
  minimum_party_size INT DEFAULT 1 NOT NULL CHECK (minimum_party_size > 0),
  maximum_party_size INT NOT NULL CHECK (maximum_party_size >= minimum_party_size),

  -- Geometry & Spatial Layout
  shape public.table_shape_enum DEFAULT 'square' NOT NULL,
  position_x INT DEFAULT 0 NOT NULL,
  position_y INT DEFAULT 0 NOT NULL,
  width INT DEFAULT 80 NOT NULL,
  height INT DEFAULT 80 NOT NULL,
  rotation INT DEFAULT 0 NOT NULL,

  -- Live State & Settings
  status public.table_status_enum DEFAULT 'available' NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  is_combinable BOOLEAN DEFAULT TRUE NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(outlet_id, table_number)
);

-- 3. Table State History Table (Audit Trail of Floor State Transitions)
CREATE TABLE IF NOT EXISTS public.table_state_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES public.restaurant_tables(id) ON DELETE CASCADE,
  old_status public.table_status_enum,
  new_status public.table_status_enum NOT NULL,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Nullable for automated system/timer actions
  changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  note TEXT
);

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tables_outlet_area 
  ON public.restaurant_tables (outlet_id, seating_area_id);

CREATE INDEX IF NOT EXISTS idx_tables_outlet_status 
  ON public.restaurant_tables (outlet_id, status);

CREATE INDEX IF NOT EXISTS idx_table_history_table_time 
  ON public.table_state_history (table_id, changed_at DESC);

-- 5. Cross-Table Consistency Trigger for Tables
-- SECURITY JUSTIFICATION: Guarantees that restaurant_tables.organization_id matches outlet_id
DROP TRIGGER IF EXISTS trg_validate_table_org ON public.restaurant_tables;
CREATE TRIGGER trg_validate_table_org
  BEFORE INSERT OR UPDATE ON public.restaurant_tables
  FOR EACH ROW EXECUTE FUNCTION public.check_outlet_organization_consistency();

-- 6. Row Level Security (RLS) Policies
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_state_history ENABLE ROW LEVEL SECURITY;

-- Restaurant Tables RLS Policies
DROP POLICY IF EXISTS "Staff can view tables for their assigned outlets" ON public.restaurant_tables;
CREATE POLICY "Staff can view tables for their assigned outlets"
  ON public.restaurant_tables
  FOR SELECT
  USING (
    public.has_outlet_access(auth.uid(), organization_id, outlet_id)
  );

DROP POLICY IF EXISTS "Staff can manage tables for their assigned outlets" ON public.restaurant_tables;
CREATE POLICY "Staff can manage tables for their assigned outlets"
  ON public.restaurant_tables
  FOR ALL
  USING (
    public.has_outlet_access(auth.uid(), organization_id, outlet_id)
  );

-- Table State History RLS Policies
DROP POLICY IF EXISTS "Staff can view table history for their assigned outlets" ON public.table_state_history;
CREATE POLICY "Staff can view table history for their assigned outlets"
  ON public.table_state_history
  FOR SELECT
  USING (
    public.has_outlet_access(auth.uid(), organization_id, outlet_id)
  );

DROP POLICY IF EXISTS "Staff can create table history records" ON public.table_state_history;
CREATE POLICY "Staff can create table history records"
  ON public.table_state_history
  FOR INSERT
  WITH CHECK (
    public.has_outlet_access(auth.uid(), organization_id, outlet_id)
  );
