import React from "react";
import { 
  Users, 
  Crown, 
  Repeat, 
  Sparkles, 
  AlertTriangle, 
  UserPlus, 
  Calendar,
  Clock
} from "lucide-react";
import { useGuests } from "../context/GuestContext";
import { GuestViewMode } from "../types";

export function GuestsHeader() {
  const { summary, filterOptions, setViewMode, openCreateModal } = useGuests();

  const currentMode = filterOptions.viewMode || "ALL";

  const tabs: { id: GuestViewMode; label: string; icon: React.ElementType }[] = [
    { id: "ALL", label: "ALL GUESTS", icon: Users },
    { id: "RETURNING", label: "RETURNING", icon: Repeat },
    { id: "VIP", label: "VIP GUESTS", icon: Crown },
    { id: "UPCOMING", label: "UPCOMING BOOKINGS", icon: Calendar },
    { id: "RECENT", label: "RECENT VISITS", icon: Clock },
  ];

  return (
    <div className="space-y-4">
      {/* Top Title & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-white/10 p-5 rounded-2xl">
        <div>
          <div className="text-purple-400 font-mono text-[10px] uppercase tracking-widest font-bold">
            HOSPITALITY CRM & GUEST INTELLIGENCE
          </div>
          <h1 className="text-2xl font-black text-white uppercase font-mono tracking-wide mt-0.5">
            GUESTS
          </h1>
          <p className="text-zinc-400 font-sans text-xs mt-1">
            Guest recognition, preferences, dietary safety alerts, and visit history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-mono text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ NEW GUEST PROFILE</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-zinc-900 border border-white/5 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="font-mono text-[10px] uppercase font-bold">Total Profiles</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {summary?.totalGuestsCount ?? "--"}
          </div>
          <div className="text-[10px] font-sans text-zinc-400">Organization-wide</div>
        </div>

        <div className="bg-zinc-900 border border-white/5 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="font-mono text-[10px] uppercase font-bold">Returning Guests</span>
            <Repeat className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {summary?.returningGuestsCount ?? "--"}
          </div>
          <div className="text-[10px] font-sans text-zinc-400">2+ completed visits</div>
        </div>

        <div className="bg-zinc-900 border border-white/5 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="font-mono text-[10px] uppercase font-bold">VIP Guests</span>
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">
            {summary?.vipGuestsCount ?? "--"}
          </div>
          <div className="text-[10px] font-sans text-zinc-400">Staff-recognized VIPs</div>
        </div>

        <div className="bg-zinc-900 border border-white/5 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="font-mono text-[10px] uppercase font-bold">Celebrations</span>
            <Sparkles className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-2xl font-black font-mono text-pink-400">
            {summary?.upcomingOccasionsCount ?? "--"}
          </div>
          <div className="text-[10px] font-sans text-zinc-400">Birthdays & Anniversaries</div>
        </div>

        <div className="bg-zinc-900 border border-white/5 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="font-mono text-[10px] uppercase font-bold">Allergy Watch</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-400">
            {summary?.allergyAlertsCount ?? "--"}
          </div>
          <div className="text-[10px] font-sans text-zinc-400">Dietary safety flags</div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-white/10 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-xs"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-transparent"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
