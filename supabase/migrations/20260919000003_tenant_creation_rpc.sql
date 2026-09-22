-- Migration 03: Atomic Tenant Creation RPC for Q F&B

-- SECURITY JUSTIFICATION:
-- Allows an authenticated user to atomically create an Organization, their Owner Organization Membership,
-- and their First Outlet in one safe database transaction.
-- `auth.uid()` is strictly checked to ensure users cannot assign organization ownership to arbitrary users.
-- Explicit `SET search_path = public, pg_temp;` secures execution.

CREATE OR REPLACE FUNCTION public.create_organization_with_outlet(
  org_name TEXT,
  outlet_name TEXT,
  country_code VARCHAR(5) DEFAULT 'MY',
  timezone_val TEXT DEFAULT 'Asia/Kuala_Lumpur',
  currency_val TEXT DEFAULT 'MYR'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_outlet_id UUID;
  v_slug TEXT;
BEGIN
  -- 1. Obtain Authenticated User ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated user cannot create an organization tenant.';
  END IF;

  -- 2. Generate Organization Slug
  v_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(md5(random()::text), 1, 6);

  -- 3. Insert Organization
  INSERT INTO public.organizations (name, slug, country_code, default_timezone, default_currency)
  VALUES (org_name, v_slug, country_code, timezone_val, currency_val)
  RETURNING id INTO v_org_id;

  -- 4. Insert Owner Organization Membership
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_org_id, v_user_id, 'owner');

  -- 5. Insert First Outlet
  INSERT INTO public.outlets (organization_id, name, slug, country, timezone)
  VALUES (v_org_id, outlet_name, 'main-outlet', country_code, timezone_val)
  RETURNING id INTO v_outlet_id;

  -- 6. Insert Owner Outlet Membership
  INSERT INTO public.outlet_members (outlet_id, user_id, role)
  VALUES (v_outlet_id, v_user_id, 'owner');

  -- Return Result Summary
  RETURN jsonb_build_object(
    'organization_id', v_org_id,
    'outlet_id', v_outlet_id,
    'status', 'created'
  );
END;
$$;
