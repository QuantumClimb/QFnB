/**
 * IStaffService — Staff Feature Service Interface
 * Phase 3J
 *
 * Defines the operational staff management API boundary.
 * All implementations (Fixture, Supabase) must satisfy this contract.
 */

import type { Role } from "../../../types";
import type { Permission } from "../permissions";
import type {
  StaffMember,
  StaffInvite,
  StaffStatus,
  CreateStaffInviteInput,
  UpdateStaffRoleInput,
  AssignOutletInput,
  RemoveOutletInput,
} from "../types";

export interface IStaffService {
  /**
   * List all staff for an organization, optionally filtered by outlet.
   * Owner/admin see all. Outlet-scoped staff see only their outlet.
   */
  listStaff(orgId: string, outletId?: string): Promise<StaffMember[]>;

  /** Get a single staff member by ID */
  getStaff(staffId: string): Promise<StaffMember | null>;

  /**
   * Create an invitation for a new staff member.
   * In DEV PREVIEW: simulation only — no real email is sent.
   *
   * PRODUCTION NOTE: Real invitation sending must be implemented through
   * a backend RPC or Edge Function with proper rate limiting and token management.
   */
  inviteStaff(input: CreateStaffInviteInput): Promise<StaffInvite>;

  /**
   * Update the role of a staff member.
   *
   * PRODUCTION SECURITY NOTE:
   * - Must be performed by an authorized higher-level user
   * - Must be validated server-side via Supabase RPC
   * - Self-promotion MUST be blocked at the database/RLS layer
   * - The last organization owner MUST NOT be demoted without ownership transfer
   */
  updateRole(input: UpdateStaffRoleInput): Promise<StaffMember>;

  /** Assign a staff member to an outlet */
  assignOutlet(input: AssignOutletInput): Promise<void>;

  /** Remove a staff member from an outlet */
  removeOutlet(input: RemoveOutletInput): Promise<void>;

  /**
   * Deactivate a staff member (sets status to 'inactive').
   * Does NOT delete the profile or membership record.
   */
  deactivateStaff(staffId: string): Promise<StaffMember>;

  /**
   * Reactivate a previously deactivated staff member.
   */
  reactivateStaff(staffId: string): Promise<StaffMember>;

  /**
   * Get the resolved permission set for a given role.
   * Uses the centralized ROLE_PERMISSIONS map.
   */
  getRolePermissions(role: Role): Promise<Permission[]>;

  /** List all pending invitations for an organization */
  listInvites(orgId: string): Promise<StaffInvite[]>;

  /** Cancel a pending invitation */
  cancelInvite(inviteId: string): Promise<void>;
}
