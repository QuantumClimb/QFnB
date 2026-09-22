import React from "react";
import { Grid, Users, Clock, Sparkles } from "lucide-react";
import { useDashboard } from "../context/DashboardContext";
import { FloorSectionStatus } from "../types";

export function FloorStatusPreview() {
  const { data } = useDashboard();
  const sections = data?.floorSections || [];

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl p-5 shadow-xl space-y-4 font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Grid className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-white uppercase tracking-wider text-sm">
            FLOOR STATUS & SEATING ZONES
          </span>
        </div>
        <span className="text-[10px] text-zinc-400">
          REAL-TIME OCCUPANCY
        </span>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {sections.map((section: FloorSectionStatus) => {
          const occupancyRate = Math.round((section.tablesOccupied / (section.tablesTotal || 1)) * 100);
          const coversRate = Math.round((section.seatedCovers / (section.capacityCovers || 1)) * 100);

          return (
            <div
              key={section.id}
              className="p-4 bg-zinc-950 border border-white/10 hover:border-white/20 rounded-xl space-y-3 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs">{section.name}</h4>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {section.tablesOccupied} seated / {section.tablesReserved} reserved / {section.tablesAvailable} open
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  section.tablesAvailable > 0
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                }`}>
                  {section.tablesAvailable > 0 ? `${section.tablesAvailable} Open` : "Full House"}
                </span>
              </div>

              {/* Progress meters */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>Table Load</span>
                  <span className="font-bold text-zinc-200">{occupancyRate}%</span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      occupancyRate > 85 ? "bg-rose-500" : occupancyRate > 60 ? "bg-amber-400" : "bg-emerald-400"
                    }`}
                    style={{ width: `${Math.min(100, occupancyRate)}%` }}
                  />
                </div>
              </div>

              {/* Footer details */}
              <div className="flex items-center justify-between pt-1 text-[10px] text-zinc-400 border-t border-white/5">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-zinc-500" />
                  {section.seatedCovers} / {section.capacityCovers} Covers
                </span>
                <span className="flex items-center gap-1 text-zinc-500">
                  <Clock className="w-3 h-3 text-zinc-600" />
                  ~{section.turnaroundAvgMins}m turn
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
