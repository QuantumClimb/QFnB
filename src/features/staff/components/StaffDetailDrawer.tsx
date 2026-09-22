import React, { useState } from "react";
import { X, ShieldCheck, Store, UserX, UserCheck as UserCheckIcon, Shield, LogOut } from "lucide-react";
import type { StaffMember } from "../types";
import type { Role } from "../../../types";
import { useStaff } from "../context/StaffContext";
import { useOrg } from "../../../context/OrgContext";
import { can, getPermissions } from "../permissions";
import type { Permission } from "../permissions";

const ROLE_OPTIONS: Role[] = [
  "owner", "admin", "manager", "host", "waiter",
  "cashier", "marketing", "kitchen", "bar", "viewer",
];

const PERMISSION_LABELS: Record<Permission, string> = {
  "today.read":          "View Today Dashboard",
  "reservations.read":   "View Reservations",
  "reservations.write":  "Manage Reservations",
  "floor.read":          "View Floor",
  "floor.manage":        "Manage Floor",
  "queue.read":          "View Queue",
  "queue.manage":        "Manage Queue",
  "orders.read":         "View Orders",
  "orders.write":        "Create/Edit Orders",
  "orders.kitchen":      "Kitchen Station Access",
  "orders.bar":          "Bar Station Access",
  "guests.read":         "View Guests",
  "guests.manage":       "Manage Guests",
  "offers.read":         "View Offers",
  "offers.manage":       "Manage Offers",
  "insights.read":       "View Insights",
  "staff.read":          "View Staff Directory",
  "staff.manage":        "Manage Staff & Roles",
  "settings.read":       "View Settings",
  "settings.manage":     "Manage Settings",
  "hotel.read":          "View Hotel Context",
  "hotel.manage":        "Manage Hotel Settings",
};

const AVATAR_COLORS = [
  "bg-purple-600","bg-indigo-600","bg-teal-600","bg-blue-600",
  "bg-emerald-600","bg-amber-600","bg-pink-600","bg-orange-600",
];
function avatarColor(id: string) {
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

interface StaffDetailDrawerProps {
  member: StaffMember;
  onClose: () => void;
}

export function StaffDetailDrawer({ member, onClose }: StaffDetailDrawerProps) {
  const { updateRole, deactivateStaff, reactivateStaff } = useStaff();
  const { role: currentUserRole } = useOrg();
  const canManage = can(currentUserRole, "staff.manage");

  const [roleEditing, setRoleEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>(member.role);
  const [isSaving, setIsSaving] = useState(false);

  const permissions = getPermissions(member.role);

  const handleRoleChange = async () => {
    if (selectedRole === member.role) { setRoleEditing(false); return; }
    setIsSaving(true);
    try {
      await updateRole({ staffId: member.id, newRole: selectedRole });
      setRoleEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (member.status === "active") {
      await deactivateStaff(member.id);
    } else {
      await reactivateStaff(member.id);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] max-w-full bg-zinc-900 border-l border-white/10 z-50 flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
          <div className="text-[10px] text-purple-400 font-mono uppercase tracking-widest">STAFF DETAIL</div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Identity Card */}
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full ${avatarColor(member.id)} flex items-center justify-center text-white text-xl font-black font-mono flex-shrink-0`}>
              {member.initials}
            </div>
            <div>
              <div className="text-xl font-bold text-white font-sans">{member.fullName}</div>
              <div className="text-sm text-zinc-400">{member.jobTitle ?? "—"}</div>
              <div className="text-xs text-zinc-500 font-mono mt-0.5">{member.email}</div>
            </div>
          </div>

          {/* Status */}
          <div className="p-4 bg-zinc-950/60 border border-white/8 rounded-lg space-y-3">
            <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">ACCOUNT STATUS</div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                member.status === "active" ? "bg-emerald-400" :
                member.status === "inactive" ? "bg-zinc-600" : "bg-amber-400 animate-pulse"
              }`} />
              <span className="text-sm font-mono font-bold text-white uppercase">{member.status}</span>
            </div>
            {member.phone && (
              <div className="text-xs text-zinc-400 font-mono">{member.phone}</div>
            )}
            {member.lastActiveAt && (
              <div className="text-[10px] text-zinc-600 font-mono">
                Last active: {new Date(member.lastActiveAt).toLocaleString()}
              </div>
            )}
          </div>

          {/* Role */}
          <div className="p-4 bg-zinc-950/60 border border-white/8 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">ROLE</div>
              {canManage && !roleEditing && (
                <button
                  onClick={() => setRoleEditing(true)}
                  className="text-[10px] font-mono text-purple-400 hover:text-purple-300 uppercase"
                >
                  CHANGE ROLE
                </button>
              )}
            </div>
            {roleEditing ? (
              <div className="space-y-2">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as Role)}
                  className="w-full bg-zinc-800 border border-white/20 text-white text-xs font-mono rounded px-3 py-2 focus:outline-none focus:border-purple-500"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r.toUpperCase()}</option>
                  ))}
                </select>
                <div className="text-[10px] text-zinc-500 font-mono">
                  ⚠ Role changes are UX preview only. Production requires server-side authorization.
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleRoleChange}
                    disabled={isSaving}
                    className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-mono font-bold uppercase rounded transition-colors"
                  >
                    {isSaving ? "SAVING..." : "CONFIRM"}
                  </button>
                  <button
                    onClick={() => { setRoleEditing(false); setSelectedRole(member.role); }}
                    className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] font-mono uppercase rounded transition-colors"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm font-bold text-white font-mono uppercase">{member.role}</div>
            )}
          </div>

          {/* Assigned Outlets */}
          <div className="p-4 bg-zinc-950/60 border border-white/8 rounded-lg space-y-3">
            <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">ASSIGNED OUTLETS</div>
            {member.assignedOutlets.length === 0 ? (
              <div className="text-xs text-zinc-600 font-mono">No outlets assigned</div>
            ) : (
              <div className="space-y-2">
                {member.assignedOutlets.map((outlet) => (
                  <div key={outlet.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-sm text-zinc-300 font-sans">{outlet.name}</span>
                    </div>
                    {canManage && (
                      <button className="text-[10px] text-zinc-600 hover:text-red-400 font-mono uppercase transition-colors">
                        REMOVE
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Permissions Summary */}
          <div className="p-4 bg-zinc-950/60 border border-white/8 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">PERMISSIONS ({permissions.length})</div>
            </div>
            <div className="space-y-1.5">
              {(permissions as readonly Permission[]).map((perm) => (
                <div key={perm} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400/60 flex-shrink-0" />
                  <span className="text-xs text-zinc-400 font-sans">{PERMISSION_LABELS[perm] ?? perm}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-white/5 text-[10px] text-zinc-600 font-mono leading-relaxed">
              These permissions are UX display only. All sensitive actions are enforced by Supabase RLS and server-side authorization in production.
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        {canManage && (
          <div className="p-6 border-t border-white/10 space-y-2 flex-shrink-0">
            <button
              onClick={handleToggleActive}
              className={`w-full flex items-center justify-center gap-2 py-2.5 text-xs font-mono font-bold uppercase rounded border transition-colors ${
                member.status === "active"
                  ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                  : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              }`}
            >
              {member.status === "active" ? (
                <><UserX className="w-3.5 h-3.5" /> DEACTIVATE</>
              ) : (
                <><UserCheckIcon className="w-3.5 h-3.5" /> REACTIVATE</>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
