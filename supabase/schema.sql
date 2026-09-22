-- ====================================================================
-- Q F&B STANDALONE OPERATIONAL APPLICATION — MULTI-TENANT SQL SCHEMA
-- Phase 3A Database Foundation: Profiles, Organizations, Outlets, Roles & RLS
-- ====================================================================

-- 1. Custom Role Enum
CREATE TYPE app_role AS ENUM (
  'owner',
  'admin',
  'manager',
  'host',
  'marketing',
  'staff',
  'viewer'
);

-- 2. Profiles Table (Linked to Supabase Auth auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Organizations Table (Restaurant Group / Company Tenant)
CREATE TABLE public.organizations (
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

-- 4. Organization Memberships (Relational Staff Membership & Global Roles)
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role DEFAULT 'staff' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(organization_id, user_id)
);

-- 5. Outlets Table (Individual Physical Restaurant Outlets)
CREATE TABLE public.outlets (
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

-- 6. Outlet Access Memberships (Scoped Staff Access)
CREATE TABLE public.outlet_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role DEFAULT 'staff' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(outlet_id, user_id)
);

-- 7. Organization Invitations Table
CREATE TABLE public.organization_invites (
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

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlet_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check Organization Membership
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Organizations Policies
CREATE POLICY "Members can view their organization" ON public.organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = organizations.id
        AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and Admins can update organization" ON public.organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = organizations.id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Outlets Policies
CREATE POLICY "Members can view organization outlets" ON public.outlets
  FOR SELECT USING (
    public.is_org_member(auth.uid(), organization_id)
  );

-- Automatically create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
