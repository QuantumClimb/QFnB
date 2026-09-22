import React from "react";
import { 
  Clock, 
  UserCheck, 
  PlusCircle, 
  RotateCw, 
  Flame,
  Layers,
  Sparkles
} from "lucide-react";
import { useDashboard } from "../context/DashboardContext";
import { useOrg } from "../../../context/OrgContext";
import { useAuth } from "../../../context/AuthContext";

interface TodayHeaderProps {
  onOpenWalkInModal: () => void;
  onOpenWaitlistModal: () => void;
}

export function TodayHeader({ onOpenWalkInModal, onOpenWaitlistModal }: TodayHeaderProps) {
  const { data, isLoading, refreshData } = useDashboard();
  const { currentOutlet } = useOrg();
  const { isDevPreview } = useAuth();

  const servicePeriod = data?.servicePeriod;
  const lastUpdated = data?.lastUpdated;

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
      {/* Subtle purple accent background gradient glow */}
      <div className="absolute top-0 right-0 w-96 h-32 bg-purple-600/10 blur-3xl pointer-events-none -mr-16 -mt-8" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        
        {/* Left: Outlet & Shift Info */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold tracking-wider uppercase text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE OPERATIONS
            </span>

            <span className="px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 font-semibold text-[11px] uppercase flex items-center gap-1">
              <Flame className="w-3 h-3 text-purple-400" />
              {servicePeriod?.statusLabel || "ACTIVE SERVICE"}
            </span>

            {isDevPreview && (
              <span className="px-2 py-0.5 rounded bg-zinc-800 border border-white/10 text-zinc-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                DEV PREVIEW
              </span>
            )}
          </div>

          <div>
            <h1 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight font-mono">
              {currentOutlet?.name || "Quantum Climb"} — TODAY
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400 font-mono mt-1">
              <span className="text-zinc-300 font-semibold">
                FRIDAY, 19 SEPTEMBER 2026
              </span>
              <span className="text-zinc-600">•</span>
              <span>
                SHIFT: <strong className="text-zinc-200">{servicePeriod?.name || "Dinner Service"}</strong> ({servicePeriod?.shiftTime || "17:30 – 23:30"})
              </span>
              <span className="text-zinc-600 hidden sm:inline">•</span>
              <span className="hidden sm:inline">
                FLOOR LEAD: <strong className="text-zinc-200">{servicePeriod?.shiftManager || "Marcus Vance"}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Operational Actions */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            onClick={onOpenWalkInModal}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold rounded-lg shadow-lg shadow-purple-900/30 transition-all transform active:scale-95"
          >
            <UserCheck className="w-4 h-4" />
            <span>Walk-In Seat</span>
          </button>

          <button
            onClick={onOpenWaitlistModal}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-white/15 font-mono text-xs font-bold rounded-lg transition-all transform active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>Add Waitlist</span>
          </button>

          <button
            onClick={() => refreshData()}
            disabled={isLoading}
            title="Refresh Live Operations Data"
            className="p-2.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/10 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-mono disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? "animate-spin text-purple-400" : ""}`} />
            <span className="hidden md:inline text-[11px] text-zinc-400">
              {lastUpdated ? `Updated ${lastUpdated}` : "Refresh"}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
