import { supabase } from "../../../lib/supabase";
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

/**
 * Production-ready Supabase implementation of IStaffService.
 * Enforces organization and outlet scoping via Supabase PostgreSQL RLS.
 */
export class SupabaseStaffService implements IStaffService {
  async listStaff(orgId: string, outletId?: string): Promise<StaffMember[]> {
    let query = supabase
      .from("organization_members")
      .select(`
        id,
        user_id,
        role,
        job_title,
        status,
        created_at,
        profiles:user_id (
          id,
          full_name,
          email,
          phone,
          avatar_url
        )
      `)
      .eq("organization_id", orgId);

    const { data: members, error } = await query;
    if (error) {
      console.error("[SupabaseStaffService] listStaff error:", error);
      throw error;
    }

    if (!members) return [];

    // Fetch assigned outlets for all users
    const userIds = members.map((m: any) => m.user_id).filter(Boolean);
    let outletMap: Record<string, { id: string; name: string; slug: string }[]> = {};

    if (userIds.length > 0) {
      const { data: outletMemberships } = await supabase
        .from("outlet_members")
        .select(`
          user_id,
          outlets:outlet_id (
            id,
            name,
            slug
          )
        `)
        .in("user_id", userIds);

      if (outletMemberships) {
        outletMemberships.forEach((om: any) => {
          if (!outletMap[om.user_id]) outletMap[om.user_id] = [];
          if (om.outlets) outletMap[om.user_id].push(om.outlets);
        });
      }
    }

    const staffMembers: StaffMember[] = members.map((m: any) => {
      const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      const fullName = profile?.full_name || "Unknown Staff";
      const nameParts = fullName.trim().split(" ");
      const initials = ((nameParts[0]?.[0] || "") + (nameParts[1]?.[0] || nameParts[0]?.[1] || "")).toUpperCase();

      return {
        id: m.user_id || m.id,
        fullName,
        email: profile?.email || "",
        role: (m.role || "viewer") as Role,
        jobTitle: m.job_title || null,
        phone: profile?.phone || null,
        avatarUrl: profile?.avatar_url || null,
        initials,
        assignedOutlets: outletMap[m.user_id] || [],
        status: m.status || "active",
        lastActiveAt: null, // Populated from activity tracking when available
        createdAt: m.created_at,
      };
    });

    if (outletId) {
      return staffMembers.filter((sm) => sm.assignedOutlets.some((o) => o.id === outletId));
    }

    return staffMembers;
  }

  async getStaff(staffId: string): Promise<StaffMember | null> {
    const { data: member, error } = await supabase
      .from("organization_members")
      .select(`
        id,
        user_id,
        role,
        job_title,
        status,
        created_at,
        profiles:user_id (
          id,
          full_name,
          email,
          phone,
          avatar_url
        )
      `)
      .eq("user_id", staffId)
      .single();

    if (error || !member) return null;

    const { data: outletMemberships } = await supabase
      .from("outlet_members")
      .select(`
        outlets:outlet_id (
          id,
          name,
          slug
        )
      `)
      .eq("user_id", staffId);

    const profile: any = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
    const fullName = profile?.full_name || "Unknown Staff";
    const nameParts = fullName.trim().split(" ");
    const initials = ((nameParts[0]?.[0] || "") + (nameParts[1]?.[0] || nameParts[0]?.[1] || "")).toUpperCase();

    return {
      id: member.user_id || member.id,
      fullName,
      email: profile?.email || "",
      role: (member.role || "viewer") as Role,
      jobTitle: member.job_title || null,
      phone: profile?.phone || null,
      avatarUrl: profile?.avatar_url || null,
      initials,
      assignedOutlets: (outletMemberships || []).map((om: any) => om.outlets).filter(Boolean),
      status: member.status || "active",
      lastActiveAt: null,
      createdAt: member.created_at,
    };
  }

  async inviteStaff(input: CreateStaffInviteInput): Promise<StaffInvite> {
    const { data, error } = await supabase
      .from("organization_invites")
      .insert({
        email: input.email.toLowerCase().trim(),
        role: input.role,
        outlet_id: input.outletId || null,
        status: "pending",
        expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[SupabaseStaffService] inviteStaff error:", error);
      throw error;
    }

    return {
      id: data.id,
      organizationId: data.organization_id || "dev-org-001",
      email: data.email,
      role: data.role as Role,
      outletId: data.outlet_id || null,
      token: data.token || data.id,
      expiresAt: data.expires_at,
      acceptedAt: data.accepted_at || null,
      createdBy: data.created_by || "system",
      createdAt: data.created_at,
    };
  }

  async revokeInvite(inviteId: string): Promise<void> {
    const { error } = await supabase
      .from("organization_invites")
      .delete()
      .eq("id", inviteId);

    if (error) {
      console.error("[SupabaseStaffService] revokeInvite error:", error);
      throw error;
    }
  }

  async cancelInvite(inviteId: string): Promise<void> {
    return this.revokeInvite(inviteId);
  }

  async listInvites(orgId: string): Promise<StaffInvite[]> {
    const { data, error } = await supabase
      .from("organization_invites")
      .select("*")
      .eq("organization_id", orgId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[SupabaseStaffService] listInvites error:", error);
      return [];
    }

    return (data || []).map((d: any) => ({
      id: d.id,
      organizationId: d.organization_id || orgId,
      email: d.email,
      role: d.role as Role,
      outletId: d.outlet_id || null,
      token: d.token || d.id,
      expiresAt: d.expires_at,
      acceptedAt: d.accepted_at || null,
      createdBy: d.created_by || "system",
      createdAt: d.created_at,
    }));
  }

  async updateRole(input: UpdateStaffRoleInput): Promise<StaffMember> {
    const { error } = await supabase
      .from("organization_members")
      .update({
        role: input.newRole,
      })
      .eq("user_id", input.staffId);

    if (error) {
      console.error("[SupabaseStaffService] updateRole error:", error);
      throw error;
    }

    const updated = await this.getStaff(input.staffId);
    if (!updated) throw new Error("Staff member not found after update");
    return updated;
  }

  async assignOutlet(input: AssignOutletInput): Promise<void> {
    const { error } = await supabase
      .from("outlet_members")
      .insert({
        outlet_id: input.outletId,
        user_id: input.staffId,
      });

    if (error && !error.message.includes("duplicate")) {
      console.error("[SupabaseStaffService] assignOutlet error:", error);
      throw error;
    }
  }

  async removeOutlet(input: RemoveOutletInput): Promise<void> {
    const { error } = await supabase
      .from("outlet_members")
      .delete()
      .eq("outlet_id", input.outletId)
      .eq("user_id", input.staffId);

    if (error) {
      console.error("[SupabaseStaffService] removeOutlet error:", error);
      throw error;
    }
  }

  async deactivateStaff(staffId: string): Promise<StaffMember> {
    const { error } = await supabase
      .from("organization_members")
      .update({ status: "inactive" })
      .eq("user_id", staffId);

    if (error) {
      console.error("[SupabaseStaffService] deactivateStaff error:", error);
      throw error;
    }

    const updated = await this.getStaff(staffId);
    if (!updated) throw new Error("Staff member not found after deactivation");
    return updated;
  }

  async reactivateStaff(staffId: string): Promise<StaffMember> {
    const { error } = await supabase
      .from("organization_members")
      .update({ status: "active" })
      .eq("user_id", staffId);

    if (error) {
      console.error("[SupabaseStaffService] reactivateStaff error:", error);
      throw error;
    }

    const updated = await this.getStaff(staffId);
    if (!updated) throw new Error("Staff member not found after reactivation");
    return updated;
  }

  async getRolePermissions(role: Role): Promise<Permission[]> {
    return [...getPermissions(role)];
  }
}
