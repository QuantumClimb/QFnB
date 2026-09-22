import React from "react";
import { Sparkles, Heart, Crown, Award, UserCheck } from "lucide-react";
import { useDashboard } from "../context/DashboardContext";
import { GuestMoment } from "../types";

export function GuestMomentsPanel() {
  const { data } = useDashboard();
  const moments = data?.guestMoments || [];

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl p-5 shadow-xl space-y-4 font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="font-bold text-white uppercase tracking-wider text-sm">
            GUEST MOMENTS & VIP TOUCHPOINTS ({moments.length})
          </span>
        </div>
        <span className="text-[10px] text-purple-300 font-bold">
          HIGH-TOUCH SERVICE
        </span>
      </div>

      {/* Moments List */}
      <div className="space-y-3">
        {moments.map((m: GuestMoment) => (
          <div
            key={m.id}
            className="p-3.5 bg-zinc-950 border border-purple-500/20 rounded-xl space-y-2 hover:border-purple-500/40 transition-all"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-xs">{m.guestName}</span>
                <span className="text-amber-400 font-bold text-[11px] px-1.5 py-0.5 bg-zinc-800 rounded border border-white/10">
                  Table {m.tableNumber}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-purple-300 text-[10px] font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30 uppercase">
                <Heart className="w-3 h-3 text-purple-400" />
                {m.occasion}
              </span>
            </div>

            <p className="text-[11px] text-zinc-300 font-sans leading-relaxed bg-zinc-900/60 p-2.5 rounded border border-white/5">
              {m.specialDetail}
            </p>

            <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5">
              <span className="flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-zinc-500" />
                Dedicated: <strong className="text-zinc-200">{m.assignedStaff}</strong>
              </span>
              <span className="text-zinc-500 font-sans">Hospitality Alert</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
