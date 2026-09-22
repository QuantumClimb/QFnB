/**
 * Q F&B Operational Role Type
 *
 * Maps directly to the PostgreSQL `app_role` enum.
 *
 * Phase 3J additions: waiter, cashier, kitchen, bar
 *
 * LEGACY NOTE: 'staff' is preserved for backward-compatibility with existing
 * organization_members rows and historical migrations. It is soft-deprecated
 * and maps operationally to 'waiter'. DO NOT remove 'staff' without a planned
 * data-migration step and a corresponding ALTER TYPE migration.
 */
export type Role =
  | 'owner'      // Full organization authority
  | 'admin'      // Platform and tenant administration
  | 'manager'    // Operational management across all modules
  | 'host'       // Reservations, arrivals, queue, seating, guest recognition
  | 'waiter'     // Table service and order workflow
  | 'cashier'    // Future checkout/payment operational role (no payment logic built)
  | 'marketing'  // Guest/offer/experience access with privacy limitations
  | 'kitchen'    // Kitchen station order workflow
  | 'bar'        // Bar station order workflow
  | 'viewer'     // Read-only access where authorized
  | 'staff';     // @deprecated — legacy alias for 'waiter'; preserved for migration safety

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended' | 'trial';
  country_code: string;
  default_timezone: string;
  default_currency: string;
  created_at: string;
  updated_at: string;
}

export interface Outlet {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  address_line1?: string;
  city?: string;
  country?: string;
  phone?: string;
  timezone: string;
  status: 'active' | 'maintenance' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: Role;
  created_at: string;
  profile?: Profile;
}

export interface OutletMember {
  id: string;
  outlet_id: string;
  user_id: string;
  role: Role;
  created_at: string;
}

export interface OrganizationInvite {
  id: string;
  organization_id: string;
  email: string;
  role: Role;
  token: string;
  expires_at: string;
  accepted_at?: string;
  created_by: string;
  created_at: string;
}

export interface SessionContext {
  user: {
    id: string;
    email?: string;
  } | null;
  profile: Profile | null;
  currentOrg: Organization | null;
  currentOutlet: Outlet | null;
  role: Role | null;
  organizations: Organization[];
  outlets: Outlet[];
  isLoading: boolean;
}
