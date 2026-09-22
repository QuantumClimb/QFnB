import React from "react";
import { ChevronRight, Mail, Store } from "lucide-react";
import type { StaffMember, StaffViewTab } from "../types";
import { useStaff } from "../context/StaffContext";
import type { Role } from "../../../types";

// ─── Role Badge ───────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<Role, { label: string; color: string }> = {
  owner:     { label: "OWNER",     color: "bg-purple-500/20 text-purple-300 border-purple-500/40" },
  admin:     { label: "ADMIN",     color: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  manager:   { label: "MANAGER",   color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" },
  host:      { label: "HOST",      color: "bg-teal-500/20 text-teal-300 border-teal-500/40" },
  waiter:    { label: "WAITER",    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  cashier:   { label: "CASHIER",   color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" },
  marketing: { label: "MARKETING", color: "bg-pink-500/20 text-pink-300 border-pink-500/40" },
  kitchen:   { label: "KITCHEN",   color: "bg-orange-500/20 text-orange-300 border-orange-500/40" },
  bar:       { label: "BAR",       color: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  viewer:    { label: "VIEWER",    color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/40" },
  staff:     { label: "STAFF",     color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/40" },
};

function RoleBadge({ role }: { role: Role }) {
  const cfg = ROLE_BADGE[role] ?? { label: role.toUpperCase(), color: "bg-zinc-700 text-zinc-300 border-zinc-600" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold border rounded ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function StatusDot({ status }: { status: StaffMember["status"] }) {
  if (status === "active")   return <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />;
  if (status === "inactive") return <span className="w-2 h-2 rounded-full bg-zinc-600 flex-shrink-0" />;
  return <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 animate-pulse" />;
}

// ─── Filter helpers ────────────────────────────────────────────────────────────

function filterByTab(members: StaffMember[], tab: StaffViewTab): StaffMember[] {
  switch (tab) {
    case "ALL_STAFF":
      return members.filter((s) => s.status !== "inactive");
    case "MANAGEMENT":
      return members.filter((s) =>
        ["owner", "admin", "manager"].includes(s.role) && s.status === "active"
      );
    case "FRONT_OF_HOUSE":
      return members.filter((s) =>
        ["host", "cashier"].includes(s.role) && s.status === "active"
      );
    case "SERVICE":
      return members.filter((s) =>
        ["waiter", "staff"].includes(s.role) && s.status === "active"
      );
    case "KITCHEN_BAR":
      return members.filter((s) =>
        ["kitchen", "bar"].includes(s.role) && s.status === "active"
      );
    case "INACTIVE":
      return members.filter((s) => s.status === "inactive");
    default:
      return members;
  }
}

// ─── Avatar Initials ───────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-purple-600",
  "bg-indigo-600",
  "bg-teal-600",
  "bg-blue-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-pink-600",
  "bg-orange-600",
];

function avatarColor(id: string) {
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// ─── Desktop Row ───────────────────────────────────────────────────────────────

function StaffRow({ member, onClick }: { member: StaffMember; onClick: () => void }) {
  return (
    <tr
      onClick={onClick}
      className="border-t border-white/5 hover:bg-white/3 cursor-pointer transition-colors group"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full ${avatarColor(member.id)} flex items-center justify-center text-white text-xs font-bold font-mono flex-shrink-0`}>
            {member.initials}
          </div>
          <div>
            <div className="text-sm font-semibold text-white font-sans">{member.fullName}</div>
            <div className="text-[11px] text-zinc-500 font-mono">{member.jobTitle ?? "—"}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-zinc-400 font-mono hidden md:table-cell">{member.email}</td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <RoleBadge role={member.role} />
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <div className="flex flex-wrap gap-1">
          {member.assignedOutlets.map((o) => (
            <span key={o.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-800 border border-white/10 text-zinc-400 text-[10px] font-mono rounded">
              <Store className="w-2.5 h-2.5" />
              {o.name}
            </span>
          ))}
          {member.assignedOutlets.length === 0 && <span className="text-zinc-600 text-[10px] font-mono">No outlets</span>}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <StatusDot status={member.status} />
          <span className="text-[10px] font-mono text-zinc-400 uppercase">{member.status}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors ml-auto" />
      </td>
    </tr>
  );
}

// ─── Mobile Card ───────────────────────────────────────────────────────────────

function StaffCard({ member, onClick }: { member: StaffMember; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-4 bg-zinc-900 border border-white/8 rounded-lg cursor-pointer hover:border-purple-500/30 transition-all duration-200"
    >
      <div className={`w-10 h-10 rounded-full ${avatarColor(member.id)} flex items-center justify-center text-white text-sm font-bold font-mono flex-shrink-0`}>
        {member.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white font-sans truncate">{member.fullName}</span>
          <StatusDot status={member.status} />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <RoleBadge role={member.role} />
          {member.assignedOutlets[0] && (
            <span className="text-[10px] text-zinc-500 font-mono truncate">{member.assignedOutlets[0].name}</span>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />
    </div>
  );
}

// ─── Main List Component ───────────────────────────────────────────────────────

export function StaffList() {
  const { staff, activeTab, setSelectedStaff } = useStaff();
  const filtered = filterByTab(staff, activeTab);

  if (filtered.length === 0) {
    return (
      <div className="p-16 text-center bg-zinc-900 border border-white/8 rounded-lg space-y-2">
        <div className="text-zinc-600 font-mono text-sm uppercase tracking-wide">No staff in this category</div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden sm:block bg-zinc-900 border border-white/8 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-950/60">
              <th className="px-4 py-3 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Staff Member</th>
              <th className="px-4 py-3 text-[10px] font-mono text-zinc-500 uppercase tracking-wider hidden md:table-cell">Email</th>
              <th className="px-4 py-3 text-[10px] font-mono text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Role</th>
              <th className="px-4 py-3 text-[10px] font-mono text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Outlets</th>
              <th className="px-4 py-3 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((member) => (
              <StaffRow
                key={member.id}
                member={member}
                onClick={() => setSelectedStaff(member)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="flex flex-col gap-2 sm:hidden">
        {filtered.map((member) => (
          <StaffCard
            key={member.id}
            member={member}
            onClick={() => setSelectedStaff(member)}
          />
        ))}
      </div>
    </>
  );
}
