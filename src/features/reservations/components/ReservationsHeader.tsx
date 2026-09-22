import React from "react";
import { 
  CalendarCheck, 
  Plus, 
  RotateCw, 
  Sparkles, 
  Calendar, 
  Clock 
} from "lucide-react";
import { useReservations } from "../context/ReservationContext";
import { useOrg } from "../../../context/OrgContext";
import { useAuth } from "../../../context/AuthContext";
import { ReservationViewMode } from "../types";

export function ReservationsHeader() {
  const { 
    reservations, 
    filters, 
    updateFilter, 
    isLoading, 
    refreshReservations, 
    setIsCreateModalOpen 
  } = useReservations();
  const { currentOutlet } = useOrg();
  const { isDevPreview } = useAuth();

  const handleViewModeChange = (mode: ReservationViewMode) => {
    updateFilter("viewMode", mode);
    if (mode === "today") {
      updateFilter("date", "2026-09-19");
    } else {
      updateFilter("date", undefined);
    }
  };

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-6">
      {/* Glow */}
      <div className="absolute top-0 right-0 w-80 h-28 bg-purple-600/10 blur-3xl pointer-events-none -mr-12 -mt-6" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        
        {/* Title and Context */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold tracking-wider uppercase text-[10px]">
              <CalendarCheck className="w-3 h-3 text-purple-400" />
              GUEST BOOKINGS & SERVICE FLOW
            </span>

            {isDevPreview && (
              <span className="px-2 py-0.5 rounded bg-zinc-800 border border-white/10 text-zinc-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                DEV PREVIEW
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight font-mono">
            RESERVATIONS — {currentOutlet?.name || "QUANTUM CLIMB"}
          </h1>
          <p className="text-xs text-zinc-400 font-sans">
            Manage guest arrivals, shift pacing, dietary notes, and table allocations.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3 font-mono text-xs">
          <button
            onClick={() => refreshReservations()}
            disabled={isLoading}
            className="p-2.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/10 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Refresh reservations"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? "animate-spin text-purple-400" : ""}`} />
            <span className="hidden sm:inline text-[11px]">Sync</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-950/40 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Reservation</span>
          </button>
        </div>

      </div>

      {/* Primary View Selector Tabs */}
      <div className="flex items-center gap-2 border-t border-white/10 pt-4 font-mono text-xs overflow-x-auto">
        <button
          onClick={() => handleViewModeChange("today")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
            filters.viewMode === "today"
              ? "bg-purple-600/20 border-purple-500/50 text-white font-bold shadow-md shadow-purple-950/30"
              : "bg-zinc-950 border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20"
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          <span>TODAY</span>
        </button>

        <button
          onClick={() => handleViewModeChange("upcoming")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
            filters.viewMode === "upcoming"
              ? "bg-purple-600/20 border-purple-500/50 text-white font-bold shadow-md shadow-purple-950/30"
              : "bg-zinc-950 border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20"
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-purple-400" />
          <span>UPCOMING</span>
        </button>

        <button
          onClick={() => handleViewModeChange("all")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
            filters.viewMode === "all"
              ? "bg-purple-600/20 border-purple-500/50 text-white font-bold shadow-md shadow-purple-950/30"
              : "bg-zinc-950 border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20"
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5 text-purple-400" />
          <span>ALL RESERVATIONS</span>
        </button>

        <div className="ml-auto text-zinc-500 text-[11px] hidden sm:block">
          Showing <strong className="text-zinc-300">{reservations.length}</strong> matching bookings
        </div>
      </div>

    </div>
  );
}
