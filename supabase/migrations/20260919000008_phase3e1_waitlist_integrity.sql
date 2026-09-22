-- ==============================================================================
-- Migration: 20260919000008_phase3e1_waitlist_integrity.sql
-- Description: Phase 3E.1 - Waitlist Integrity & RLS Policy Hardening (LOCAL ONLY)
-- Fixes: Corrects has_outlet_access() signature to (auth.uid(), org_id, outlet_id),
--        ensures pgcrypto extension is registered for token generation.
-- DO NOT APPLY REMOTELY
-- ==============================================================================

-- 1. Ensure pgcrypto Extension is Registered
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop and Recreate RLS Policies with Hardened 3-Parameter Signature
DROP POLICY IF EXISTS "waitlist_entries_tenant_isolation" ON public.waitlist_entries;
DROP POLICY IF EXISTS "waitlist_status_history_tenant_isolation" ON public.waitlist_status_history;

CREATE POLICY "waitlist_entries_tenant_isolation"
    ON public.waitlist_entries
    FOR ALL
    USING (public.has_outlet_access(auth.uid(), organization_id, outlet_id))
    WITH CHECK (public.has_outlet_access(auth.uid(), organization_id, outlet_id));

CREATE POLICY "waitlist_status_history_tenant_isolation"
    ON public.waitlist_status_history
    FOR ALL
    USING (public.has_outlet_access(auth.uid(), organization_id, outlet_id))
    WITH CHECK (public.has_outlet_access(auth.uid(), organization_id, outlet_id));

-- 3. Enforce Token Integrity
ALTER TABLE public.waitlist_entries
    ALTER COLUMN guest_status_token SET NOT NULL;

-- 4. Status Transition Validation Trigger
CREATE OR REPLACE FUNCTION public.check_waitlist_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Only validate if status is being modified
    IF OLD.status IS NOT NULL AND OLD.status <> NEW.status THEN
        -- Prevent transitions from terminal or seated state without explicit reactivation
        IF OLD.status = 'seated' THEN
            RAISE EXCEPTION 'Invalid waitlist status transition: Cannot modify already seated entry (ID: %)', OLD.id
                USING ERRCODE = '22023';
        END IF;

        IF (OLD.status = 'cancelled' OR OLD.status = 'no_response') AND (NEW.status = 'seated' OR NEW.status = 'ready') THEN
            RAISE EXCEPTION 'Invalid waitlist status transition: Cannot transition % entry to % directly', OLD.status, NEW.status
                USING ERRCODE = '22023';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_waitlist_status_transition ON public.waitlist_entries;
CREATE TRIGGER trg_check_waitlist_status_transition
    BEFORE UPDATE OF status
    ON public.waitlist_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.check_waitlist_status_transition();
