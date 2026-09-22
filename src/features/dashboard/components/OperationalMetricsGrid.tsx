import React from "react";
import { 
  CalendarCheck, 
  Users, 
  Grid, 
  Clock, 
  UtensilsCrossed, 
  BellRing, 
  CheckCircle2, 
  AlertTriangle 
} from "lucide-react";
import { useDashboard } from "../context/DashboardContext";

export function OperationalMetricsGrid() {
  const { data } = useDashboard();
  const kpis = data?.kpis;

  if (!kpis) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-28 bg-zinc-900/60 border border-white/5 rounded-xl" />
        ))}
      </div>
    );
  }

  const occupancyPercent = Math.round((kpis.guestsSeatedCount / (kpis.seatingCapacityMax || 1)) * 100);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-4 font-mono">
      
      {/* 1. Today's Reservations */}
      <div className="bg-zinc-900 border border-white/10 hover:border-purple-500/30 transition-all rounded-xl p-4 flex flex-col justify-between space-y-2 shadow-lg group">
        <div className="flex items-center justify-between text-zinc-400 text-[11px] tracking-wider uppercase">
          <span className="truncate">Reservations</span>
          <CalendarCheck className="w-4 h-4 text-purple-400 flex-shrink-0" />
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-white">{kpis.reservationsCount}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span className="text-emerald-400 font-bold">{kpis.reservationsSeated} seated</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-300">{kpis.reservationsConfirmed} conf</span>
          </div>
        </div>
      </div>

      {/* 2. Expected Covers */}
      <div className="bg-zinc-900 border border-white/10 hover:border-purple-500/30 transition-all rounded-xl p-4 flex flex-col justify-between space-y-2 shadow-lg group">
        <div className="flex items-center justify-between text-zinc-400 text-[11px] tracking-wider uppercase">
          <span className="truncate">Expected Covers</span>
          <Users className="w-4 h-4 text-purple-400 flex-shrink-0" />
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-white">{kpis.expectedCovers}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span className="text-emerald-400 font-bold">{kpis.coversSeated} in house</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">{kpis.coversRemaining} left</span>
          </div>
        </div>
      </div>

      {/* 3. Guests Seated / Capacity */}
      <div className="bg-zinc-900 border border-white/10 hover:border-emerald-500/30 transition-all rounded-xl p-4 flex flex-col justify-between space-y-2 shadow-lg group">
        <div className="flex items-center justify-between text-zinc-400 text-[11px] tracking-wider uppercase">
          <span className="truncate">Guests Seated</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
            {occupancyPercent}%
          </span>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            {kpis.guestsSeatedCount} <span className="text-sm font-normal text-zinc-500">/ {kpis.seatingCapacityMax}</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, occupancyPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4. Tables Available */}
      <div className="bg-zinc-900 border border-white/10 hover:border-amber-500/30 transition-all rounded-xl p-4 flex flex-col justify-between space-y-2 shadow-lg group">
        <div className="flex items-center justify-between text-zinc-400 text-[11px] tracking-wider uppercase">
          <span className="truncate">Tables Open</span>
          <Grid className="w-4 h-4 text-amber-400 flex-shrink-0" />
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300">
            {kpis.tablesAvailableCount} <span className="text-sm font-normal text-zinc-500">/ {kpis.tablesTotalCount}</span>
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">
            {kpis.tablesTotalCount - kpis.tablesAvailableCount} Active / In Service
          </div>
        </div>
      </div>

      {/* 5. Active Waitlist */}
      <div className="bg-zinc-900 border border-white/10 hover:border-amber-500/30 transition-all rounded-xl p-4 flex flex-col justify-between space-y-2 shadow-lg group">
        <div className="flex items-center justify-between text-zinc-400 text-[11px] tracking-wider uppercase">
          <span className="truncate">Waitlist</span>
          <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {kpis.activeWaitlistParties} <span className="text-xs text-zinc-400 font-normal">parties</span>
          </div>
          <div className="text-[10px] text-amber-400 mt-0.5 font-semibold">
            {kpis.activeWaitlistCovers} covers (~{kpis.avgWaitTimeMinutes}m wait)
          </div>
        </div>
      </div>

      {/* 6. Pending Orders */}
      <div className="bg-zinc-900 border border-white/10 hover:border-purple-500/30 transition-all rounded-xl p-4 flex flex-col justify-between space-y-2 shadow-lg group">
        <div className="flex items-center justify-between text-zinc-400 text-[11px] tracking-wider uppercase">
          <span className="truncate">Kitchen Orders</span>
          <UtensilsCrossed className="w-4 h-4 text-purple-400 flex-shrink-0" />
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-white">{kpis.pendingOrdersCount}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1">
            {kpis.pendingOrdersDelayedCount > 0 ? (
              <span className="text-rose-400 font-bold flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3 inline" />
                {kpis.pendingOrdersDelayedCount} delayed
              </span>
            ) : (
              <span className="text-emerald-400">All within target</span>
            )}
          </div>
        </div>
      </div>

      {/* 7. Orders Ready */}
      <div className="bg-zinc-900 border border-white/10 hover:border-emerald-500/30 transition-all rounded-xl p-4 flex flex-col justify-between space-y-2 shadow-lg group">
        <div className="flex items-center justify-between text-zinc-400 text-[11px] tracking-wider uppercase">
          <span className="truncate">Plated / Ready</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">{kpis.ordersReadyCount}</div>
          <div className="text-[10px] text-emerald-300/80 mt-0.5">
            Ready for runners
          </div>
        </div>
      </div>

      {/* 8. Service Alerts */}
      <div className={`bg-zinc-900 border transition-all rounded-xl p-4 flex flex-col justify-between space-y-2 shadow-lg group ${
        kpis.serviceAlertsCount > 0 ? "border-rose-500/40 bg-rose-950/10" : "border-white/10"
      }`}>
        <div className="flex items-center justify-between text-zinc-400 text-[11px] tracking-wider uppercase">
          <span className="truncate">Service Alerts</span>
          <BellRing className={`w-4 h-4 flex-shrink-0 ${kpis.serviceAlertsCount > 0 ? "text-rose-400 animate-bounce" : "text-zinc-500"}`} />
        </div>
        <div>
          <div className={`text-2xl sm:text-3xl font-black ${kpis.serviceAlertsCount > 0 ? "text-rose-400" : "text-zinc-400"}`}>
            {kpis.serviceAlertsCount}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">
            {kpis.serviceAlertsCount > 0 ? "Requires attention" : "No active alerts"}
          </div>
        </div>
      </div>

    </div>
  );
}
