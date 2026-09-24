-- Migration 01: Core Tables & Enums for Q F&B Multi-Tenant Platform

-- 1. App Role Enum
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM (
    'owner',
    'admin',
    'manager',
    'host',
    'marketing',
    'staff',
    'viewer'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial')) NOT NULL,
  country_code VARCHAR(5) DEFAULT 'MY' NOT NULL,
  default_timezone TEXT DEFAULT 'Asia/Kuala_Lumpur' NOT NULL,
  default_currency VARCHAR(5) DEFAULT 'MYR' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Organization Memberships
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role DEFAULT 'staff' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(organization_id, user_id)
);

-- 5. Outlets Table
CREATE TABLE IF NOT EXISTS public.outlets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  address_line1 TEXT,
  city TEXT,
  country TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'Asia/Kuala_Lumpur' NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(organization_id, slug)
);

-- 6. Outlet Access Memberships
CREATE TABLE IF NOT EXISTS public.outlet_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role DEFAULT 'staff' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(outlet_id, user_id)
);

-- 7. Organization Invitations
CREATE TABLE IF NOT EXISTS public.organization_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role app_role DEFAULT 'staff' NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
