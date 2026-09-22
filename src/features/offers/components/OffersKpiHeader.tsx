import React from "react";
import { Sparkles, Tag, CalendarCheck, Gift } from "lucide-react";
import { useOffers } from "../context/OffersContext";

export function OffersKpiHeader() {
  const { summary, isLoading } = useOffers();

  const kpis = [
    {
      label: "ACTIVE EXPERIENCES",
      subtext: "Published packages & tasting sets",
      value: isLoading ? "..." : summary?.activeExperiencesCount ?? 0,
      icon: Sparkles,
      accent: "text-purple-400",
      border: "border-purple-500/20",
    },
    {
      label: "ACTIVE OFFERS",
      subtext: "Hospitality privileges & perks",
      value: isLoading ? "..." : summary?.activeOffersCount ?? 0,
      icon: Tag,
      accent: "text-emerald-400",
      border: "border-emerald-500/20",
    },
    {
      label: "UPCOMING BOOKINGS",
      subtext: "Reservations with attached experiences",
      value: isLoading ? "..." : summary?.upcomingExperienceBookingsCount ?? 0,
      icon: CalendarCheck,
      accent: "text-sky-400",
      border: "border-sky-500/20",
    },
    {
      label: "ADD-ONS ATTACHED TODAY",
      subtext: "Cakes, flowers & custom decor",
      value: isLoading ? "..." : summary?.addonsAttachedTodayCount ?? 0,
      icon: Gift,
      accent: "text-amber-400",
      border: "border-amber-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.label}
            className={`bg-zinc-900 border ${kpi.border} p-4 rounded-lg flex flex-col justify-between transition hover:border-white/20`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                {kpi.label}
              </span>
              <Icon className={`w-4 h-4 ${kpi.accent}`} />
            </div>
            <div className="mt-3">
              <div className="text-2xl md:text-3xl font-black font-mono text-white tracking-tight">
                {kpi.value}
              </div>
              <div className="text-[11px] text-zinc-400 font-sans mt-0.5 truncate">
                {kpi.subtext}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
