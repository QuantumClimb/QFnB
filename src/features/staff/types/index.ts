/**
 * Staff Feature Types — Phase 3J
 *
 * These types model the operational staff directory layer built on top of:
 *   profiles           → authenticated staff identity
 *   organization_members → org-level role membership
 *   outlet_members       → outlet-level role membership
 *   organization_invites → pending invitation lifecycle
 *
 * NOTE: These types are strictly for STAFF (authenticated users).
 * They are completely separate from `Guest` (hospitality customers, Phase 3G).
 */

import type { Role } from "../../../types";

// ─────────────────────────────────────────────────────────────────────────────
// Operational Staff Status
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simple operational status for a staff member.
 * Does NOT model payroll, employment type, or HR states.
 */
export type StaffStatus = "active" | "inactive" | "invited";

// ─────────────────────────────────────────────────────────────────────────────
// Staff Member
// ─────────────────────────────────────────────────────────────────────────────

/** Outlet reference attached to a staff member for multi-outlet display */
export interface StaffOutletRef {
  id: string;
  name: string;
  slug: string;
}

/**
 * A staff member record aggregating:
 *   - Profile identity (name, email, phone, avatar)
 *   - Organization membership role
 *   - Outlet assignments
 *   - Operational status
 *
 * Development-only optional fields are marked with comments.
 * Do NOT add HR-sensitive employment records here.
 */
export interface StaffMember {
  /** UUID from profiles.id / auth.users.id */
  id: string;
  /** Full display name from profiles.full_name */
  fullName: string;
  /** Email from auth.users (not stored in profiles directly — dev fixture only) */
  email: string;
  /** Operational role from organization_members.role */
  role: Role;
  /** Human-readable job title — from organization_members.job_title (Phase 3J addition) */
  jobTitle: string | null;
  /** Phone number from profiles.phone */
  phone: string | null;
  /** Avatar URL (null in dev = use initials) */
  avatarUrl: string | null;
  /** Computed initials for avatar fallback, e.g. "NL" for Natasha Lim */
  initials: string;
  /** Outlets this staff member is assigned to */
  assignedOutlets: StaffOutletRef[];
  /** Operational status */
  status: StaffStatus;
  /** ISO timestamp of last recorded activity (dev fixture only, informational) */
  lastActiveAt: string | null;
  /** ISO timestamp of profile creation */
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Staff Invite
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mirrors public.organization_invites.
 * In DEV PREVIEW, invitation sends are simulated (no real email).
 */
export interface StaffInvite {
  id: string;
  organizationId: string;
  email: string;
  role: Role;
  /** Outlet assignment for the invite (optional — org-wide if null) */
  outletId: string | null;
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdBy: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service Input Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateStaffInviteInput {
  email: string;
  role: Role;
  /** Optional outlet to pre-assign upon invite acceptance */
  outletId: string | null;
}

export interface UpdateStaffRoleInput {
  staffId: string;
  newRole: Role;
  /**
   * SECURITY NOTE: In production, role changes MUST be performed by an
   * authorized higher-level user and validated server-side via a Supabase RPC
   * or Edge Function. Client-side role changes are UX only.
   *
   * Self-promotion MUST be blocked at the database/RLS/RPC layer.
   * The last organization owner MUST NOT be demoted without ownership transfer.
   */
}

export interface AssignOutletInput {
  staffId: string;
  outletId: string;
}

export interface RemoveOutletInput {
  staffId: string;
  outletId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Staff Tab / Filter
// ─────────────────────────────────────────────────────────────────────────────

export type StaffViewTab =
  | "ALL_STAFF"
  | "MANAGEMENT"
  | "FRONT_OF_HOUSE"
  | "SERVICE"
  | "KITCHEN_BAR"
  | "INACTIVE";
