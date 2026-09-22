import React from "react";
import { UserCheck, UserPlus } from "lucide-react";
import type { StaffViewTab } from "../types";
import { useStaff } from "../context/StaffContext";
import { useOrg } from "../../../context/OrgContext";
import { can } from "../permissions";

const TABS: { id: StaffViewTab; label: string }[] = [
  { id: "ALL_STAFF",      label: "ALL STAFF" },
  { id: "MANAGEMENT",     label: "MANAGEMENT" },
  { id: "FRONT_OF_HOUSE", label: "FRONT OF HOUSE" },
  { id: "SERVICE",        label: "SERVICE" },
  { id: "KITCHEN_BAR",    label: "KITCHEN / BAR" },
  { id: "INACTIVE",       label: "INACTIVE" },
];

interface StaffHeaderProps {
  onInvite: () => void;
}

export function StaffHeader({ onInvite }: StaffHeaderProps) {
  const { activeTab, setActiveTab, staff, invites } = useStaff();
  const { role } = useOrg();
  const canManage = can(role, "staff.manage");

  const activeCount = staff.filter((s) => s.status === "active").length;
  const inviteCount = invites.length;

  return (
    <div className="space-y-4">
      {/* Page Heading */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-purple-400 uppercase tracking-widest text-[10px] font-mono mb-1">
            STAFF DIRECTORY & ROLE MANAGEMENT
          </div>
          <h1 className="text-3xl font-black text-white uppercase font-mono tracking-tight">
            STAFF
          </h1>
          <p className="text-zinc-400 font-sans text-sm mt-1">
            {activeCount} active member{activeCount !== 1 ? "s" : ""}
            {inviteCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded text-xs font-mono">
                {inviteCount} pending invite{inviteCount !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>

        {canManage && (
          <button
            onClick={onInvite}
            id="btn-invite-staff"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold uppercase tracking-wider rounded transition-all duration-200 shadow-lg shadow-purple-900/30 flex-shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>INVITE STAFF</span>
          </button>
        )}
      </div>

      {/* Tab Strip */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`tab-staff-${tab.id.toLowerCase()}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-purple-600/20 text-white border border-purple-500/40"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
