import React from "react";
import { RestaurantTable } from "../types";
import { Users, Clock, CheckCircle2, Armchair, UtensilsCrossed, Receipt, Brush, Ban, AlertTriangle } from "lucide-react";

interface TableCardProps {
  table: RestaurantTable;
  onSelect: (t: RestaurantTable) => void;
}

export function TableCard({ table, onSelect }: TableCardProps) {
  const isOccupied = !!table.current_session;
  const isOverTime = table.current_session && table.current_session.elapsedMinutes > table.current_session.expectedDurationMinutes;

  return (
    <div
      onClick={() => onSelect(table)}
      className="bg-zinc-950 border border-white/10 hover:border-purple-500/40 rounded-2xl p-4 transition-all cursor-pointer shadow-lg space-y-3"
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-base font-black text-white">{table.table_number}</span>
          <span className="text-zinc-400 font-mono text-xs flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-zinc-500" />
            {table.capacity}p
          </span>
          <span className="text-[10px] text-zinc-500 font-mono uppercase bg-zinc-900 px-1.5 py-0.5 rounded border border-white/5">
            {table.shape}
          </span>
        </div>

        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
          table.status === "available"
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
            : table.status === "seated" || table.status === "dining" || table.status === "ordering"
            ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
            : table.status === "reserved"
            ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
            : table.status === "arriving"
            ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
            : table.status === "bill_requested"
            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
            : table.status === "cleaning"
            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
            : "bg-zinc-800 text-zinc-400 border-white/10"
        }`}>
          {table.status.replace("_", " ")}
        </span>
      </div>

      {/* Middle row */}
      {isOccupied && table.current_session ? (
        <div className="space-y-1">
          <div className="font-bold text-white text-sm">{table.current_session.guestName}</div>
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>{table.current_session.partySize} Guests</span>
            <span className={isOverTime ? "text-rose-400 font-bold" : "text-purple-300 font-semibold"}>
              {table.current_session.elapsedMinutes}m / {table.current_session.expectedDurationMinutes}m
            </span>
          </div>
          {table.current_session.specialOccasion && (
            <div className="text-[11px] text-purple-300 font-sans truncate">
              {table.current_session.specialOccasion}
            </div>
          )}
        </div>
      ) : table.next_reservation ? (
        <div className="space-y-1 font-mono text-xs">
          <div className="text-blue-300 font-semibold flex items-center gap-1 text-[11px]">
            <Clock className="w-3.5 h-3.5" />
            Next: {table.next_reservation.reservationTime} • {table.next_reservation.guestName}
          </div>
          <div className="text-zinc-500 text-[10px]">
            {table.next_reservation.partySize} Guests ({table.next_reservation.depositStatus || "Confirmed"})
          </div>
        </div>
      ) : (
        <div className="text-xs text-zinc-500 font-sans">
          {table.status === "cleaning" ? "Table is being cleaned" : "Available for walk-in"}
        </div>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between text-[11px] text-zinc-500 border-t border-white/5 pt-2 font-mono">
        <span className="truncate">{table.seating_area_name}</span>
        <span className="text-zinc-400 text-[10px]">Tap for actions →</span>
      </div>
    </div>
  );
}
