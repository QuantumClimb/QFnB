-- ============================================================
-- Migration 14: Phase 3J — Staff, Settings & Hotel Mode
-- ============================================================
-- LOCAL MIGRATION ONLY
-- DO NOT run: supabase db push
-- DO NOT apply remotely
-- DO NOT modify live Supabase or production database
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. Extend app_role enum with new operational roles
--
--    SAFE ADDITIVE OPERATION: ALTER TYPE ADD VALUE IF NOT EXISTS
--    does NOT drop or recreate the enum.
--    does NOT modify historical membership rows.
--    does NOT break existing RLS policies.
--
--    LEGACY NOTE: 'staff' is deliberately preserved.
--    It is soft-deprecated and maps operationally to 'waiter'.
--    DO NOT remove 'staff' without:
--      a) A planned data-migration step to rewrite existing rows
--      b) A corresponding ALTER TYPE DROP VALUE (only safe in PG15+)
--      c) Auditing all RLS policies and application code for 'staff' references
-- ──────────────────────────────────────────────────────────────

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'waiter';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cashier';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'kitchen';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'bar';

-- ──────────────────────────────────────────────────────────────
-- 2. Enrich organization_members with optional staff metadata
--
--    job_title: Human-readable operational title (e.g. "Head Bartender")
--    status: Simple operational state (active / inactive / invited)
--
--    Uses ADD COLUMN IF NOT EXISTS — safe to run multiple times.
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'invited'));

-- ──────────────────────────────────────────────────────────────
-- 3. outlet_settings — Centralized typed settings per outlet
--
--    Stores all operational settings as a typed JSONB blob.
--    TypeScript interfaces enforce the structure in application code.
--    Prefer JSONB over dozens of tiny settings tables.
--
--    settings_json structure follows OutletSettings TypeScript type:
--      { restaurant, service, reservations, floor, queue, orders, guests, hotel }
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.outlet_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  outlet_id       UUID UNIQUE NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  settings_json   JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for organization-level queries
CREATE INDEX IF NOT EXISTS idx_outlet_settings_org_id
  ON public.outlet_settings(organization_id);

-- ──────────────────────────────────────────────────────────────
-- 4. RLS for outlet_settings
--
--    READ:  Any organization member can read their outlet settings
--           (wide read access is acceptable for configuration display)
--    WRITE: Only owner, admin, or manager roles can modify settings
--
--    SECURITY NOTE: Frontend permission checks (hasPermission / can())
--    are UX-layer only. This RLS policy is the authoritative enforcement.
--    Never rely on hidden UI buttons as authorization.
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.outlet_settings ENABLE ROW LEVEL SECURITY;

-- READ: Any org member
CREATE POLICY "Org members can read outlet settings"
  ON public.outlet_settings
  FOR SELECT
  USING (
    public.is_org_member(auth.uid(), organization_id)
  );

-- WRITE: Owner, Admin, Manager only
-- PRODUCTION NOTE: For Hotel Mode toggles specifically, consider restricting
-- to owner/admin only via a separate granular policy in a future migration.
CREATE POLICY "Managers and above can write outlet settings"
  ON public.outlet_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = outlet_settings.organization_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin', 'manager')
    )
  );

-- ──────────────────────────────────────────────────────────────
-- 5. updated_at trigger for outlet_settings
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_outlet_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER outlet_settings_updated_at
  BEFORE UPDATE ON public.outlet_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_outlet_settings_updated_at();

-- ──────────────────────────────────────────────────────────────
-- 6. Staff & Permission Architecture Documentation
--
--    The following notes document production requirements that are
--    enforced in application code and documented here for completeness.
--    These are NOT enforced by database constraints in this migration
--    but are planned for future hardening migrations.
-- ──────────────────────────────────────────────────────────────

-- PRODUCTION REQUIREMENTS (future hardening):
--
-- A. SELF-PROMOTION PREVENTION
--    Role changes must be performed by an authorized higher-level user.
--    Implement as a SECURITY DEFINER RPC that validates:
--      - The requesting user has sufficient role authority
--      - The target user is not at or above the requesting user's level
--      - The change does not reduce the organization below 1 owner
--
-- B. LAST OWNER PROTECTION
--    The final organization owner must not be removable or demovable
--    without explicit ownership transfer. Implement as a trigger or RPC
--    that checks COUNT of owner-role members before any demotion/removal.
--
-- C. STAFF RLS HARDENING (future migration)
--    Regular operational roles (host, waiter, kitchen, bar, viewer)
--    must not gain write access to organization_members or outlet_members.
--    Current migration relies on organization-level role checks.
--    Future: add explicit DENY policies for non-management roles.

-- ──────────────────────────────────────────────────────────────
-- END OF MIGRATION 14
-- ──────────────────────────────────────────────────────────────
