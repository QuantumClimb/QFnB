-- ====================================================================
-- Q F&B STANDALONE OPERATIONAL APPLICATION - MULTI-TENANT SQL SCHEMA
-- Phase 3D.1 Hardened: Floor Integrity, Foreign Keys, Cross-Entity Constraints & Audit Validation
-- ====================================================================

-- 1. Foreign Key: reservations.assigned_table_id -> restaurant_tables.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_reservations_assigned_table'
  ) THEN
    ALTER TABLE public.reservations 
      ADD CONSTRAINT fk_reservations_assigned_table 
      FOREIGN KEY (assigned_table_id) 
      REFERENCES public.restaurant_tables(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Hardened Table Capacity Check Constraints
DO $$ BEGIN
  -- Ensure minimum_party_size <= maximum_party_size <= capacity
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_table_capacity_bounds'
  ) THEN
    ALTER TABLE public.restaurant_tables
      ADD CONSTRAINT chk_table_capacity_bounds
      CHECK (
        capacity > 0 
        AND minimum_party_size > 0 
        AND maximum_party_size >= minimum_party_size 
        AND maximum_party_size <= capacity
      );
  END IF;
END $$;

-- 3. Trigger Function: Reservation & Table Tenant Consistency
-- SECURITY JUSTIFICATION: Guarantees assigned table belongs to the exact same organization and outlet as the reservation
CREATE OR REPLACE FUNCTION public.check_reservation_table_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.assigned_table_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.restaurant_tables
      WHERE id = NEW.assigned_table_id 
        AND organization_id = NEW.organization_id 
        AND outlet_id = NEW.outlet_id
    ) THEN
      RAISE EXCEPTION 'Cross-Tenant Violation: Table % does not belong to Organization % / Outlet %', 
        NEW.assigned_table_id, NEW.organization_id, NEW.outlet_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_reservation_table_tenant ON public.reservations;
CREATE TRIGGER trg_validate_reservation_table_tenant
  BEFORE INSERT OR UPDATE OF assigned_table_id, organization_id, outlet_id ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.check_reservation_table_consistency();

-- 4. Trigger Function: Table & Seating Area Consistency
-- SECURITY JUSTIFICATION: Guarantees table belongs to the exact same organization and outlet as its seating area
CREATE OR REPLACE FUNCTION public.check_table_seating_area_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.seating_areas
    WHERE id = NEW.seating_area_id 
      AND organization_id = NEW.organization_id 
      AND outlet_id = NEW.outlet_id
  ) THEN
    RAISE EXCEPTION 'Cross-Tenant Violation: Seating Area % does not belong to Organization % / Outlet %', 
      NEW.seating_area_id, NEW.organization_id, NEW.outlet_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_table_seating_area ON public.restaurant_tables;
CREATE TRIGGER trg_validate_table_seating_area
  BEFORE INSERT OR UPDATE OF seating_area_id, organization_id, outlet_id ON public.restaurant_tables
  FOR EACH ROW EXECUTE FUNCTION public.check_table_seating_area_consistency();

-- 5. Trigger Function: Table State History Consistency
-- SECURITY JUSTIFICATION: Guarantees audit record table and optional reservation match the exact organization and outlet
CREATE OR REPLACE FUNCTION public.check_table_state_history_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Validate table belongs to org + outlet
  IF NOT EXISTS (
    SELECT 1 FROM public.restaurant_tables
    WHERE id = NEW.table_id 
      AND organization_id = NEW.organization_id 
      AND outlet_id = NEW.outlet_id
  ) THEN
    RAISE EXCEPTION 'Cross-Tenant Violation: Table % does not match History Record Org % / Outlet %', 
      NEW.table_id, NEW.organization_id, NEW.outlet_id;
  END IF;

  -- If reservation_id is present, validate reservation matches org + outlet
  IF NEW.reservation_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.reservations
      WHERE id = NEW.reservation_id 
        AND organization_id = NEW.organization_id 
        AND outlet_id = NEW.outlet_id
    ) THEN
      RAISE EXCEPTION 'Cross-Tenant Violation: Reservation % does not match History Record Org % / Outlet %', 
        NEW.reservation_id, NEW.organization_id, NEW.outlet_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_table_state_history ON public.table_state_history;
CREATE TRIGGER trg_validate_table_state_history
  BEFORE INSERT OR UPDATE ON public.table_state_history
  FOR EACH ROW EXECUTE FUNCTION public.check_table_state_history_consistency();
