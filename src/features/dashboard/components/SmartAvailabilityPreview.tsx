import React from "react";
import { Compass, Users, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useDashboard } from "../context/DashboardContext";
import { SmartAvailabilitySlot } from "../types";

export function SmartAvailabilityPreview() {
  const { data } = useDashboard();
  const slots = data?.smartAvailability || [];

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl p-5 shadow-xl space-y-4 font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-white uppercase tracking-wider text-sm">
            SMART AVAILABILITY & NEXT SEATING
          </span>
        </div>
        <span className="text-[10px] text-emerald-400 font-bold">
          FAST HOST ADVICE
        </span>
      </div>

      {/* Slots Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {slots.map((slot: SmartAvailabilitySlot, i: number) => {
          const isImmediate = slot.nextAvailableTime === "Immediate";
          const isWaitlist = slot.confidence === "waitlist_only";

          return (
            <div
              key={i}
              className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2.5 transition-all ${
                isImmediate
                  ? "bg-emerald-950/20 border-emerald-500/30"
                  : isWaitlist
                  ? "bg-zinc-950 border-white/10 opacity-70"
                  : "bg-zinc-950 border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                  <Users className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{slot.partySize} Covers Party</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isImmediate
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : isWaitlist
                    ? "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                    : "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                }`}>
                  {slot.nextAvailableTime}
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] text-zinc-300 font-sans">
                  {slot.suggestedTable}
                </div>
                <div className="text-[10px] text-zinc-500">
                  {slot.section}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
