import React from "react";
import { 
  CalendarCheck, 
  Clock, 
  Users, 
  Crown, 
  Sparkles, 
  CheckCircle, 
  AlertCircle,
  Phone,
  Tag
} from "lucide-react";
import { useDashboard } from "../context/DashboardContext";
import { UpcomingReservation, GuestTier, ReservationStatus } from "../types";

export function UpcomingReservationsPanel() {
  const { data, checkInReservation } = useDashboard();
  const reservations = data?.upcomingReservations || [];

  const getTierBadge = (tier: GuestTier) => {
    switch (tier) {
      case "vvip":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 font-mono text-[10px] font-bold">
            <Crown className="w-3 h-3 text-purple-400" />
            VVIP
          </span>
        );
      case "vip":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold">
            <Sparkles className="w-3 h-3 text-amber-400" />
            VIP
          </span>
        );
      case "first_time":
        return (
          <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 font-mono text-[10px] font-bold">
            NEW GUEST
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusDisplay = (status: ReservationStatus) => {
    switch (status) {
      case "seated":
        return (
          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] font-bold">
            SEATED
          </span>
        );
      case "arriving_soon":
        return (
          <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono text-[10px] font-bold animate-pulse">
            ARRIVING SOON
          </span>
        );
      case "late":
        return (
          <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 font-mono text-[10px] font-bold flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            RUNNING LATE
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/10 font-mono text-[10px]">
            CONFIRMED
          </span>
        );
    }
  };

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl p-5 shadow-xl space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 font-mono text-xs">
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-4 h-4 text-purple-400" />
          <span className="font-bold text-white uppercase tracking-wider text-sm">
            UPCOMING RESERVATIONS ({reservations.length})
          </span>
        </div>
        <span className="text-[10px] text-zinc-400 font-mono">
          DINNER SERVICE PACING
        </span>
      </div>

      {/* Reservation Cards List */}
      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
        {reservations.map((res: UpcomingReservation) => (
          <div
            key={res.id}
            className={`p-4 rounded-xl border transition-all ${
              res.status === "seated" 
                ? "bg-zinc-950/60 border-emerald-500/20 opacity-80" 
                : res.status === "late"
                ? "bg-rose-950/10 border-rose-500/30"
                : res.guestTier === "vvip"
                ? "bg-purple-950/20 border-purple-500/30"
                : "bg-zinc-950 border-white/10 hover:border-white/20"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              
              {/* Left Details */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    {res.time}
                  </span>
                  <span className="font-bold text-white text-sm truncate">
                    {res.guestName}
                  </span>
                  {getTierBadge(res.guestTier)}
                  {getStatusDisplay(res.status)}
                </div>

                {/* Sub row: Party size, section, table */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 font-mono">
                  <span className="flex items-center gap-1 text-zinc-300 font-medium">
                    <Users className="w-3.5 h-3.5 text-zinc-400" />
                    {res.partySize} Guests
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span>{res.section}</span>
                  <span className="text-zinc-600">•</span>
                  <span className={res.tableNumber ? "text-amber-400 font-bold" : "text-rose-400 font-semibold"}>
                    {res.tableNumber ? `Table ${res.tableNumber}` : "Unassigned Table"}
                  </span>
                  {res.visitSummary && (
                    <>
                      <span className="text-zinc-600 hidden md:inline">•</span>
                      <span className="text-zinc-400 hidden md:inline">{res.visitSummary}</span>
                    </>
                  )}
                </div>

                {/* Guest Tags */}
                {res.tags && res.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {res.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full bg-zinc-800 border border-white/10 text-[10px] text-zinc-300 font-sans"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {res.notes && (
                  <p className="text-[11px] text-zinc-400 font-sans italic bg-zinc-900/80 p-2 rounded border border-white/5 mt-1">
                    "{res.notes}"
                  </p>
                )}
              </div>

              {/* Right Action */}
              <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0 font-mono text-xs">
                {res.status !== "seated" ? (
                  <button
                    onClick={() => checkInReservation(res.id)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-950/40 transition-all active:scale-95"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Seat Guest</span>
                  </button>
                ) : (
                  <div className="text-emerald-400 font-bold text-xs flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 rounded border border-emerald-500/20">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>In Service</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
