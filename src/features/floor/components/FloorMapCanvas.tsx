import React from "react";
import { RestaurantTable, TableStatus, TableShape } from "../types";
import { useFloor } from "../context/FloorContext";
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  Armchair, 
  UtensilsCrossed, 
  Receipt, 
  Brush, 
  Ban, 
  Sparkles,
  AlertTriangle 
} from "lucide-react";

interface FloorMapCanvasProps {
  onSelectTable: (table: RestaurantTable) => void;
}

export function FloorMapCanvas({ onSelectTable }: FloorMapCanvasProps) {
  const { tables, selectedTable } = useFloor();

  const getStatusVisuals = (status: TableStatus) => {
    switch (status) {
      case "available":
        return {
          label: "AVAILABLE",
          border: "border-emerald-500/40 hover:border-emerald-400 bg-emerald-950/20",
          badgeBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
          icon: CheckCircle2,
          textColor: "text-emerald-400",
        };
      case "reserved":
        return {
          label: "RESERVED",
          border: "border-blue-500/40 hover:border-blue-400 bg-blue-950/20",
          badgeBg: "bg-blue-500/15 text-blue-300 border-blue-500/30",
          icon: Clock,
          textColor: "text-blue-300",
        };
      case "arriving":
        return {
          label: "ARRIVING",
          border: "border-amber-500/60 hover:border-amber-400 bg-amber-950/30 ring-1 ring-amber-400/30",
          badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse",
          icon: Clock,
          textColor: "text-amber-300",
        };
      case "seated":
        return {
          label: "SEATED",
          border: "border-purple-500/50 hover:border-purple-400 bg-purple-950/20",
          badgeBg: "bg-purple-500/20 text-purple-300 border-purple-500/40",
          icon: Armchair,
          textColor: "text-purple-300",
        };
      case "ordering":
        return {
          label: "ORDERING",
          border: "border-purple-500/50 hover:border-purple-400 bg-purple-950/30",
          badgeBg: "bg-purple-500/20 text-purple-200 border-purple-500/40",
          icon: UtensilsCrossed,
          textColor: "text-purple-200",
        };
      case "dining":
        return {
          label: "DINING",
          border: "border-purple-600/60 hover:border-purple-400 bg-purple-950/30",
          badgeBg: "bg-purple-600/25 text-purple-100 border-purple-400 font-bold",
          icon: UtensilsCrossed,
          textColor: "text-purple-200",
        };
      case "bill_requested":
        return {
          label: "BILL REQ",
          border: "border-amber-500/50 hover:border-amber-400 bg-amber-950/30",
          badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold",
          icon: Receipt,
          textColor: "text-amber-300",
        };
      case "cleaning":
        return {
          label: "CLEANING",
          border: "border-amber-500/40 hover:border-amber-300 bg-zinc-950/80 border-dashed",
          badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          icon: Brush,
          textColor: "text-amber-400",
        };
      case "blocked":
        return {
          label: "BLOCKED",
          border: "border-white/10 bg-zinc-950 opacity-60",
          badgeBg: "bg-zinc-800 text-zinc-500 border-white/10",
          icon: Ban,
          textColor: "text-zinc-500",
        };
      default:
        return {
          label: status,
          border: "border-white/10 bg-zinc-950",
          badgeBg: "bg-zinc-800 text-zinc-400 border-white/10",
          icon: CheckCircle2,
          textColor: "text-zinc-400",
        };
    }
  };

  const getShapeStyles = (shape: TableShape) => {
    switch (shape) {
      case "round":
        return "rounded-full aspect-square text-center flex flex-col items-center justify-center";
      case "booth":
        return "rounded-2xl border-t-4 border-t-purple-500/40 bg-zinc-950/90";
      case "bar":
        return "rounded-xl border-l-4 border-l-amber-500/40";
      case "rectangle":
        return "rounded-2xl";
      default:
        return "rounded-2xl";
    }
  };

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
      {/* Legend & Help bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] font-mono text-zinc-400 border-b border-white/10 pb-3">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Available</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>Seated / Dining</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span>Reserved</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Arriving / Bill Req</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-500" />
            <span>Cleaning / Blocked</span>
          </span>
        </div>

        <span className="text-zinc-500 hidden sm:inline">
          Tap table to open operational actions
        </span>
      </div>

      {/* Visual Tables Matrix Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-3.5 sm:gap-4 font-mono">
        {tables.map((table: RestaurantTable) => {
          const config = getStatusVisuals(table.status);
          const IconComponent = config.icon;
          const shapeStyle = getShapeStyles(table.shape);
          const isSelected = selectedTable?.id === table.id;

          const isOverTime = table.current_session && table.current_session.elapsedMinutes > table.current_session.expectedDurationMinutes;

          return (
            <div
              key={table.id}
              onClick={() => onSelectTable(table)}
              className={`p-3.5 border transition-all cursor-pointer shadow-lg relative flex flex-col justify-between min-h-[140px] group ${shapeStyle} ${config.border} ${
                isSelected ? "ring-2 ring-purple-500 ring-offset-2 ring-offset-zinc-950 scale-[1.02]" : ""
              }`}
            >
              {/* Top Row: Table Number & Shape Badge */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black text-white group-hover:text-purple-300 transition-colors">
                    {table.table_number}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-sans flex items-center gap-0.5">
                    <Users className="w-3 h-3 text-zinc-500 inline" />
                    {table.capacity}p
                  </span>
                </div>

                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border inline-flex items-center gap-1 ${config.badgeBg}`}>
                  <IconComponent className="w-2.5 h-2.5" />
                  <span>{config.label}</span>
                </span>
              </div>

              {/* Middle Body: Dynamic Content depending on table state */}
              <div className="my-1.5 w-full space-y-0.5">
                {/* 1. If Occupied (Seated, Dining, Ordering, Bill Req) */}
                {table.current_session ? (
                  <div className="space-y-0.5">
                    <div className="font-bold text-white text-xs truncate">
                      {table.current_session.guestName}
                    </div>
                    <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 font-sans">
                      <span>{table.current_session.partySize} Guests</span>
                      <span>•</span>
                      <span className={`font-mono font-bold ${isOverTime ? "text-rose-400" : "text-purple-300"}`}>
                        {table.current_session.elapsedMinutes}m seated
                      </span>
                    </div>
                    {isOverTime && (
                      <div className="text-[9px] text-rose-400 font-bold uppercase flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        OVER DURATION
                      </div>
                    )}
                  </div>
                ) : table.next_reservation ? (
                  /* 2. If Reserved / Upcoming Booking */
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-blue-300 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{table.next_reservation.reservationTime}</span>
                    </div>
                    <div className="text-[11px] text-zinc-200 truncate font-medium">
                      {table.next_reservation.guestName}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {table.next_reservation.partySize} Guests
                    </div>
                  </div>
                ) : (
                  /* 3. Empty / Available / Cleaning */
                  <div className="text-[11px] text-zinc-500 font-sans py-1">
                    {table.status === "cleaning" 
                      ? "Bussing & sanitizing" 
                      : table.status === "blocked" 
                      ? "Held by manager" 
                      : "Open for walk-in"}
                  </div>
                )}
              </div>

              {/* Bottom Row: Zone name / Sub-caption */}
              <div className="flex items-center justify-between text-[9px] text-zinc-500 border-t border-white/5 pt-1 w-full truncate">
                <span className="truncate">{table.display_name || table.seating_area_name}</span>
                <span className="text-zinc-600 font-sans"># {table.table_number}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
