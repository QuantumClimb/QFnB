/**
 * SupabaseStaffService — Production Stub
 * Phase 3J
 *
 * Future implementation of IStaffService backed by Supabase.
 *
 * When connecting:
 * 1. Replace all `throw` statements with actual Supabase queries.
 * 2. Use SECURITY DEFINER RPCs for role changes, not direct table writes.
 * 3. Enforce RLS at the database level — never trust client-only checks.
 * 4. Implement server-side validation for:
 *    - Self-promotion prevention
 *    - Last owner protection (ownership transfer required before demotion)
 *    - Role escalation prevention (no client-side role promotion)
 *
 * Production RLS Design:
 *   - organization_members SELECT: is_org_member(auth.uid(), org_id)
 *   - organization_members INSERT/UPDATE/DELETE: role IN ('owner', 'admin') only
 *   - outlet_members SELECT: has_outlet_access(auth.uid(), org_id, outlet_id)
 *   - outlet_members INSERT/UPDATE/DELETE: role IN ('owner', 'admin', 'manager') only
 *   - organization_invites INSERT: role IN ('owner', 'admin', 'manager') only
 */

import type { Role } from "../../../types";
import type { IStaffService } from "./IStaffService";
import type { Permission } from "../permissions";
import type {
  StaffMember,
  StaffInvite,
  CreateStaffInviteInput,
  UpdateStaffRoleInput,
  AssignOutletInput,
  RemoveOutletInput,
} from "../types";

export class SupabaseStaffService implements IStaffService {
  async listStaff(_orgId: string, _outletId?: string): Promise<StaffMember[]> {
    throw new Error("SupabaseStaffService: Not implemented. Connect Supabase.");
  }

  async getStaff(_staffId: string): Promise<StaffMember | null> {
    throw new Error("SupabaseStaffService: Not implemented. Connect Supabase.");
  }

  async inviteStaff(_input: CreateStaffInviteInput): Promise<StaffInvite> {
    throw new Error("SupabaseStaffService: Not implemented. Connect Supabase.");
  }

  async updateRole(_input: UpdateStaffRoleInput): Promise<StaffMember> {
    throw new Error("SupabaseStaffService: Not implemented. Connect Supabase.");
  }

  async assignOutlet(_input: AssignOutletInput): Promise<void> {
    throw new Error("SupabaseStaffService: Not implemented. Connect Supabase.");
  }

  async removeOutlet(_input: RemoveOutletInput): Promise<void> {
    throw new Error("SupabaseStaffService: Not implemented. Connect Supabase.");
  }

  async deactivateStaff(_staffId: string): Promise<StaffMember> {
    throw new Error("SupabaseStaffService: Not implemented. Connect Supabase.");
  }

  async reactivateStaff(_staffId: string): Promise<StaffMember> {
    throw new Error("SupabaseStaffService: Not implemented. Connect Supabase.");
  }

  async getRolePermissions(_role: Role): Promise<Permission[]> {
    throw new Error("SupabaseStaffService: Not implemented. Connect Supabase.");
  }

  async listInvites(_orgId: string): Promise<StaffInvite[]> {
    throw new Error("SupabaseStaffService: Not implemented. Connect Supabase.");
  }

  async cancelInvite(_inviteId: string): Promise<void> {
    throw new Error("SupabaseStaffService: Not implemented. Connect Supabase.");
  }
}
