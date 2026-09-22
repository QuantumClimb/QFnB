import React from "react";
import { Users, Clock, Flame, UserCheck, Sparkles, Plus, AlertCircle } from "lucide-react";
import { useQueue } from "../context/QueueContext";

export function QueueHeader() {
  const { summary, openAddModal } = useQueue();

  const getPressureBadge = () => {
    const pressure = summary?.queuePressure || "NORMAL";
    switch (pressure) {
      case "HIGH_WAIT":
        return {
          label: "HIGH PRESSURE",
          bg: "bg-rose-500/10 border-rose-500/30 text-rose-400",
          dot: "bg-rose-500 animate-pulse",
        };
      case "BUSY":
        return {
          label: "BUSY SERVICE",
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
          dot: "bg-amber-500",
        };
      case "NORMAL":
      default:
        return {
          label: "NORMAL TEMPO",
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
          dot: "bg-emerald-500",
        };
    }
  };

  const badge = getPressureBadge();

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-900 border border-white/10 p-5 rounded-xl shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-amber-400 uppercase tracking-widest text-[11px] font-mono font-semibold">
              HOST STAND & LIVE SERVICE PACING
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold tracking-wider ${badge.bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
              {badge.label}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase font-mono tracking-tight mt-1">
            QUEUE
          </h1>
          <p className="text-zinc-400 font-sans text-xs md:text-sm mt-0.5">
            Operational guest waitlist, deterministic wait pacing, table preparation, and host dispatch.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 px-5 py-3 rounded-lg font-mono text-xs md:text-sm font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            ADD TO WAITLIST
          </button>
        </div>
      </div>

      {/* 6 Key Operational Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Waiting Parties */}
        <div className="bg-zinc-900/90 border border-white/10 p-3.5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono uppercase tracking-wider">
            <span>Waiting Parties</span>
            <Users className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white font-mono">{summary?.waitingParties ?? 0}</span>
            <span className="text-[10px] text-zinc-500 font-mono">parties</span>
          </div>
        </div>

        {/* Total Guests Waiting */}
        <div className="bg-zinc-900/90 border border-white/10 p-3.5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono uppercase tracking-wider">
            <span>Guests Waiting</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-400 font-mono">{summary?.totalGuestsWaiting ?? 0}</span>
            <span className="text-[10px] text-zinc-500 font-mono">covers</span>
          </div>
        </div>

        {/* Average Wait */}
        <div className="bg-zinc-900/90 border border-white/10 p-3.5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono uppercase tracking-wider">
            <span>Average Wait</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white font-mono">{summary?.averageWaitMinutes ?? 0}</span>
            <span className="text-[10px] text-zinc-500 font-mono">min</span>
          </div>
        </div>

        {/* Longest Wait */}
        <div className="bg-zinc-900/90 border border-white/10 p-3.5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono uppercase tracking-wider">
            <span>Longest Wait</span>
            <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-orange-400 font-mono">{summary?.longestWaitMinutes ?? 0}</span>
            <span className="text-[10px] text-zinc-500 font-mono">min</span>
          </div>
        </div>

        {/* Tables Preparing */}
        <div className="bg-zinc-900/90 border border-white/10 p-3.5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono uppercase tracking-wider">
            <span>Tables Preparing</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-purple-300 font-mono">{summary?.tablesPreparingCount ?? 0}</span>
            <span className="text-[10px] text-zinc-500 font-mono">tables</span>
          </div>
        </div>

        {/* Guests Notified */}
        <div className="bg-zinc-900/90 border border-white/10 p-3.5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono uppercase tracking-wider">
            <span>Guests Notified</span>
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-400 font-mono">{summary?.guestsNotifiedCount ?? 0}</span>
            <span className="text-[10px] text-zinc-500 font-mono">paged</span>
          </div>
        </div>
      </div>
    </div>
  );
}
