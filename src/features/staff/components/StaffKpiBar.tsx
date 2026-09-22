import React from "react";
import { Users, UserCheck, Clock, Briefcase } from "lucide-react";
import { useStaff } from "../context/StaffContext";

interface KpiTileProps {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  bg: string;
}

function KpiTile({ label, value, icon: Icon, accent, bg }: KpiTileProps) {
  return (
    <div className={`flex items-center gap-4 p-4 ${bg} border border-white/8 rounded-lg`}>
      <div className={`p-2.5 rounded-lg ${accent}/10`}>
        <Icon className={`w-5 h-5 ${accent}`} />
      </div>
      <div>
        <div className="text-2xl font-black text-white font-mono">{value}</div>
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono mt-0.5">{label}</div>
      </div>
    </div>
  );
}

export function StaffKpiBar() {
  const { staff, invites } = useStaff();

  const totalActive = staff.filter((s) => s.status === "active").length;
  const invitedPending = invites.length;
  const management = staff.filter((s) =>
    ["owner", "admin", "manager"].includes(s.role) && s.status === "active"
  ).length;
  const foh = staff.filter((s) =>
    ["host", "waiter", "cashier", "staff"].includes(s.role) && s.status === "active"
  ).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiTile
        label="ACTIVE STAFF"
        value={totalActive}
        icon={Users}
        accent="text-purple-400"
        bg="bg-zinc-900"
      />
      <KpiTile
        label="PENDING INVITES"
        value={invitedPending}
        icon={Clock}
        accent="text-amber-400"
        bg="bg-zinc-900"
      />
      <KpiTile
        label="MANAGEMENT"
        value={management}
        icon={Briefcase}
        accent="text-blue-400"
        bg="bg-zinc-900"
      />
      <KpiTile
        label="FRONT OF HOUSE"
        value={foh}
        icon={UserCheck}
        accent="text-emerald-400"
        bg="bg-zinc-900"
      />
    </div>
  );
}
