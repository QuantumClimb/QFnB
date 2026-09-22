import React from "react";
import { 
  Grid, 
  Sparkles, 
  RotateCw, 
  UserCheck, 
  Compass, 
  Clock, 
  Users, 
  CheckCircle2, 
  Armchair, 
  Brush, 
  LayoutGrid, 
  Layers 
} from "lucide-react";
import { useFloor } from "../context/FloorContext";
import { useOrg } from "../../../context/OrgContext";
import { useAuth } from "../../../context/AuthContext";

interface FloorHeaderProps {
  viewMode: "canvas" | "grid";
  onViewModeChange: (mode: "canvas" | "grid") => void;
}

export function FloorHeader({ viewMode, onViewModeChange }: FloorHeaderProps) {
  const { floorSummary, isLoading, refreshFloor, setActiveModal } = useFloor();
  const { currentOutlet } = useOrg();
  const { isDevPreview } = useAuth();

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-5">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-32 bg-amber-500/10 blur-3xl pointer-events-none -mr-12 -mt-6" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        
        {/* Title and Outlet Metadata */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold tracking-wider uppercase text-[10px]">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              FLOOR CONTROL & SEATING MATRIX
            </span>

            {isDevPreview && (
              <span className="px-2 py-0.5 rounded bg-zinc-800 border border-white/10 text-zinc-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                DEV PREVIEW
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight font-mono">
            FLOOR — {currentOutlet?.name || "QUANTUM CLIMB"}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 font-mono">
            <span>SHIFT: <strong className="text-zinc-200">Dinner Service (17:30 – 23:30)</strong></span>
            <span className="text-zinc-600">•</span>
            <span>FLOOR LEAD: <strong className="text-zinc-200">Marcus Vance</strong></span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 font-mono text-xs">
          {/* View mode toggle (Canvas vs Card Grid) */}
          <div className="hidden sm:flex items-center bg-zinc-950 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => onViewModeChange("canvas")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                viewMode === "canvas"
                  ? "bg-purple-600 text-white font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Map View</span>
            </button>
            <button
              onClick={() => onViewModeChange("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                viewMode === "grid"
                  ? "bg-purple-600 text-white font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>

          <button
            onClick={() => setActiveModal("smart_availability")}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold transition-all active:scale-95"
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Smart Availability</span>
          </button>

          <button
            onClick={() => setActiveModal("seat_walkin")}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-950/40 transition-all active:scale-95"
          >
            <UserCheck className="w-4 h-4" />
            <span>Seat Walk-In</span>
          </button>

          <button
            onClick={() => refreshFloor()}
            disabled={isLoading}
            className="p-2.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/10 rounded-xl transition-colors disabled:opacity-50"
            title="Refresh floor matrix"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? "animate-spin text-purple-400" : ""}`} />
          </button>
        </div>

      </div>

      {/* Operational Counters & Occupancy Meter */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-white/10 font-mono text-xs">
        
        {/* Occupancy */}
        <div className="p-3 bg-zinc-950 border border-white/10 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase">
            <span>Covers In House</span>
            <Users className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-black text-white">
            {floorSummary?.occupiedCapacity || 0} <span className="text-xs font-normal text-zinc-500">/ {floorSummary?.totalCapacity || 120}</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-purple-500 h-full rounded-full transition-all"
              style={{ width: `${floorSummary?.occupancyRatePercent || 0}%` }}
            />
          </div>
        </div>

        {/* Available Tables */}
        <div className="p-3 bg-zinc-950 border border-emerald-500/20 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase">
            <span>Available</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400">
            {floorSummary?.availableCount || 0}
          </div>
          <div className="text-[10px] text-zinc-500">Ready for walk-in</div>
        </div>

        {/* Occupied / Dining */}
        <div className="p-3 bg-zinc-950 border border-purple-500/20 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase">
            <span>Seated / Dining</span>
            <Armchair className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-black text-purple-300">
            {(floorSummary?.seatedCount || 0) + (floorSummary?.diningCount || 0)}
          </div>
          <div className="text-[10px] text-zinc-500">Active sessions</div>
        </div>

        {/* Reserved */}
        <div className="p-3 bg-zinc-950 border border-blue-500/20 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase">
            <span>Reserved</span>
            <Clock className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-black text-blue-300">
            {floorSummary?.reservedCount || 0}
          </div>
          <div className="text-[10px] text-zinc-500">Allocated bookings</div>
        </div>

        {/* Arriving Soon */}
        <div className="p-3 bg-zinc-950 border border-amber-500/20 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase">
            <span>Arriving Soon</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <div className="text-xl font-black text-amber-400">
            {floorSummary?.arrivingCount || 0}
          </div>
          <div className="text-[10px] text-zinc-500">Hold state active</div>
        </div>

        {/* Cleaning */}
        <div className="p-3 bg-zinc-950 border border-white/10 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase">
            <span>Cleaning</span>
            <Brush className="w-3.5 h-3.5 text-amber-300" />
          </div>
          <div className="text-xl font-black text-amber-300">
            {floorSummary?.cleaningCount || 0}
          </div>
          <div className="text-[10px] text-zinc-500">Bussing & sanitize</div>
        </div>

      </div>

    </div>
  );
}
