/**
 * FixtureStaffService — Development Implementation of IStaffService
 * Phase 3J
 *
 * Used exclusively in DEV PREVIEW mode.
 * Operates on in-memory fixture data — no Supabase calls.
 */

import type { Role } from "../../../types";
import type { IStaffService } from "./IStaffService";
import type { Permission } from "../permissions";
import { getPermissions } from "../permissions";
import type {
  StaffMember,
  StaffInvite,
  CreateStaffInviteInput,
  UpdateStaffRoleInput,
  AssignOutletInput,
  RemoveOutletInput,
} from "../types";
import { DEV_FIXTURE_STAFF, DEV_FIXTURE_INVITES } from "../fixtures/staffFixtures";

function generateId(): string {
  return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export class FixtureStaffService implements IStaffService {
  private staff: StaffMember[] = [...DEV_FIXTURE_STAFF];
  private invites: StaffInvite[] = [...DEV_FIXTURE_INVITES];

  async listStaff(orgId: string, outletId?: string): Promise<StaffMember[]> {
    let result = this.staff;
    if (outletId) {
      result = result.filter((s) =>
        s.assignedOutlets.some((o) => o.id === outletId)
      );
    }
    return [...result];
  }

  async getStaff(staffId: string): Promise<StaffMember | null> {
    return this.staff.find((s) => s.id === staffId) ?? null;
  }

  async inviteStaff(input: CreateStaffInviteInput): Promise<StaffInvite> {
    // Simulation only — no real email send
    const invite: StaffInvite = {
      id: generateId(),
      organizationId: "dev-org-001",
      email: input.email,
      role: input.role,
      outletId: input.outletId,
      token: generateId(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      acceptedAt: null,
      createdBy: "dev-staff-001",
      createdAt: new Date().toISOString(),
    };
    this.invites.push(invite);
    return invite;
  }

  async updateRole(input: UpdateStaffRoleInput): Promise<StaffMember> {
    const idx = this.staff.findIndex((s) => s.id === input.staffId);
    if (idx === -1) throw new Error(`Staff member ${input.staffId} not found`);
    this.staff[idx] = { ...this.staff[idx], role: input.newRole };
    return this.staff[idx];
  }

  async assignOutlet(input: AssignOutletInput): Promise<void> {
    const idx = this.staff.findIndex((s) => s.id === input.staffId);
    if (idx === -1) throw new Error(`Staff member ${input.staffId} not found`);
    const already = this.staff[idx].assignedOutlets.some(
      (o) => o.id === input.outletId
    );
    if (!already) {
      this.staff[idx] = {
        ...this.staff[idx],
        assignedOutlets: [
          ...this.staff[idx].assignedOutlets,
          { id: input.outletId, name: "New Outlet", slug: input.outletId },
        ],
      };
    }
  }

  async removeOutlet(input: RemoveOutletInput): Promise<void> {
    const idx = this.staff.findIndex((s) => s.id === input.staffId);
    if (idx === -1) throw new Error(`Staff member ${input.staffId} not found`);
    this.staff[idx] = {
      ...this.staff[idx],
      assignedOutlets: this.staff[idx].assignedOutlets.filter(
        (o) => o.id !== input.outletId
      ),
    };
  }

  async deactivateStaff(staffId: string): Promise<StaffMember> {
    const idx = this.staff.findIndex((s) => s.id === staffId);
    if (idx === -1) throw new Error(`Staff member ${staffId} not found`);
    this.staff[idx] = { ...this.staff[idx], status: "inactive" };
    return this.staff[idx];
  }

  async reactivateStaff(staffId: string): Promise<StaffMember> {
    const idx = this.staff.findIndex((s) => s.id === staffId);
    if (idx === -1) throw new Error(`Staff member ${staffId} not found`);
    this.staff[idx] = { ...this.staff[idx], status: "active" };
    return this.staff[idx];
  }

  async getRolePermissions(role: Role): Promise<Permission[]> {
    return [...getPermissions(role)] as Permission[];
  }

  async listInvites(orgId: string): Promise<StaffInvite[]> {
    return this.invites.filter(
      (i) => i.organizationId === orgId && i.acceptedAt === null
    );
  }

  async cancelInvite(inviteId: string): Promise<void> {
    this.invites = this.invites.filter((i) => i.id !== inviteId);
  }
}
