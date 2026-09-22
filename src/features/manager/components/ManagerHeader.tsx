import React from "react";
import {
  ShieldAlert,
  Clock,
  RotateCw,
  Activity,
  Calendar,
  BarChart2,
  Building2,
  UserCheck
} from "lucide-react";
import { useManager } from "../context/ManagerContext";
import { ManagerViewMode } from "../types";

export function ManagerHeader() {
  const { viewMode, setViewMode, snapshot, isLoading, refreshSnapshot } = useManager();

  const tabs: { id: ManagerViewMode; label: string; mobileLabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "LIVE_SERVICE", label: "LIVE SERVICE", mobileLabel: "LIVE", icon: Activity },
    { id: "TODAY", label: "TODAY", mobileLabel: "TODAY", icon: Calendar },
    { id: "INSIGHTS", label: "SERVICE INSIGHTS", mobileLabel: "INSIGHTS", icon: BarChart2 },
  ];

  return (
    <div className="space-y-4">
      {/* Top Banner: Shift & Service Context */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-zinc-900 border border-white/10 p-5 md:p-6 rounded-lg">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5 font-mono text-[10px] uppercase tracking-wider">
            <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-purple-300 font-bold flex items-center gap-1">
              <Activity className="w-3 h-3 text-purple-400 animate-pulse" />
              <span>{snapshot?.servicePeriod || "DINNER"} SERVICE</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-bold">
              {snapshot?.serviceStatus.replace("_", " ") || "ACTIVE PEAK"}
            </span>
            <span className="text-zinc-500 font-sans text-xs">
              • DEV PREVIEW DATA
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-white uppercase font-mono tracking-tight flex items-center gap-2">
            <span>MANAGER LIVE VIEW</span>
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400 mt-1.5">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
              <span>{snapshot?.outletName || "Quantum Climb"}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <UserCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Manager: <strong className="text-white">{snapshot?.currentManager || "Marcus Vance"}</strong></span>
            </span>
          </div>
        </div>

        {/* Right side: Last refreshed timestamp & manual refresh */}
        <div className="flex items-center gap-3 self-start lg:self-auto">
          <div className="text-right font-mono text-xs">
            <div className="text-[10px] text-zinc-500 uppercase">DATA FRESHNESS</div>
            <div className="text-zinc-300 font-semibold flex items-center gap-1 justify-end">
              <Clock className="w-3 h-3 text-zinc-400" />
              <span>{snapshot?.lastRefreshedAt || "Live"}</span>
            </div>
          </div>

          <button
            onClick={refreshSnapshot}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded border border-white/10 font-mono text-xs font-semibold transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-purple-400" : ""}`} />
            <span>REFRESH</span>
          </button>
        </div>
      </div>

      {/* Tabs — responsive labels, proper focus handling */}
      <div className="flex items-center gap-1 bg-zinc-900/80 border border-white/10 p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = viewMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={[
                "flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-2 md:px-4 py-2 rounded font-mono text-[11px] md:text-xs font-bold whitespace-nowrap transition-colors",
                "outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-900",
                isActive
                  ? "bg-purple-600 text-white shadow-sm shadow-purple-900/50"
                  : "text-zinc-400 hover:text-white hover:bg-white/5",
              ].join(" ")}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              {/* Short label on mobile, full label on md+ */}
              <span className="md:hidden">{tab.mobileLabel}</span>
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
