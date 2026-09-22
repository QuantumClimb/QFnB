import React from "react";
import {
  Users,
  CalendarCheck,
  Grid,
  CheckCircle,
  ListOrdered,
  Clock,
  UtensilsCrossed,
  Bell,
  AlertTriangle
} from "lucide-react";
import { useManager } from "../context/ManagerContext";

export function ManagerKpiBar() {
  const { snapshot, isLoading } = useManager();
  const kpis = snapshot?.kpis;

  const cards = [
    {
      label: "COVERS IN HOUSE",
      value: isLoading ? "..." : kpis?.coversInHouse ?? 0,
      sub: "Seated dining patrons",
      icon: Users,
      accent: "text-purple-400",
      border: "border-purple-500/20",
    },
    {
      label: "EXPECTED COVERS",
      value: isLoading ? "..." : kpis?.expectedCoversToday ?? 0,
      sub: "Reservations + walk-ins",
      icon: CalendarCheck,
      accent: "text-sky-400",
      border: "border-sky-500/20",
    },
    {
      label: "TABLES OCCUPIED",
      value: isLoading ? "..." : kpis?.tablesOccupied ?? 0,
      sub: "Active guest dining",
      icon: Grid,
      accent: "text-amber-400",
      border: "border-amber-500/20",
    },
    {
      label: "TABLES AVAILABLE",
      value: isLoading ? "..." : kpis?.tablesAvailable ?? 0,
      sub: "Ready for immediate seating",
      icon: CheckCircle,
      accent: "text-emerald-400",
      border: "border-emerald-500/20",
    },
    {
      label: "ACTIVE WAITLIST",
      value: isLoading ? "..." : `${kpis?.activeWaitlistParties ?? 0} parties`,
      sub: `Avg wait ${kpis?.averageActiveWaitMinutes ?? 0}m`,
      icon: ListOrdered,
      accent: "text-rose-400",
      border: "border-rose-500/20",
    },
    {
      label: "ORDERS PREPARING",
      value: isLoading ? "..." : kpis?.ordersPreparing ?? 0,
      sub: "Kitchen + Bar active",
      icon: UtensilsCrossed,
      accent: "text-indigo-400",
      border: "border-indigo-500/20",
    },
    {
      label: "ORDERS READY",
      value: isLoading ? "..." : kpis?.ordersReady ?? 0,
      sub: "At pass awaiting runner",
      icon: Clock,
      accent: "text-teal-400",
      border: "border-teal-500/20",
    },
    {
      label: "SERVICE ALERTS",
      value: isLoading ? "..." : kpis?.serviceAlertsCount ?? 0,
      sub: "Attention items",
      icon: AlertTriangle,
      accent: (kpis?.serviceAlertsCount ?? 0) > 0 ? "text-rose-400" : "text-zinc-500",
      border: (kpis?.serviceAlertsCount ?? 0) > 0 ? "border-rose-500/40" : "border-white/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className={`bg-zinc-900 border ${c.border} p-3.5 rounded-lg flex flex-col justify-between transition hover:border-white/20`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] text-zinc-400 font-bold uppercase tracking-wider line-clamp-1">
                {c.label}
              </span>
              <Icon className={`w-3.5 h-3.5 ${c.accent} shrink-0`} />
            </div>

            <div className="mt-2.5">
              <div className="font-mono text-xl md:text-2xl font-black text-white tracking-tight">
                {c.value}
              </div>
              <div className="font-sans text-[10px] text-zinc-400 mt-0.5 truncate">
                {c.sub}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
