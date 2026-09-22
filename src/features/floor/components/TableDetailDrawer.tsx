import React from "react";
import { RestaurantTable, TableStatus } from "../types";
import { useFloor } from "../context/FloorContext";
import { 
  X, 
  Users, 
  Clock, 
  MapPin, 
  Sparkles, 
  AlertTriangle, 
  UtensilsCrossed, 
  Receipt, 
  Brush, 
  Ban, 
  CheckCircle2, 
  UserCheck, 
  Armchair, 
  ArrowRightLeft,
  FileText,
  UserPlus
} from "lucide-react";

interface TableDetailDrawerProps {
  table: RestaurantTable | null;
  onClose: () => void;
}

export function TableDetailDrawer({ table, onClose }: TableDetailDrawerProps) {
  const { 
    changeTableStatus, 
    markCleaning, 
    markAvailable, 
    blockTable, 
    setActiveModal, 
    setModalTargetTable 
  } = useFloor();

  if (!table) return null;

  const session = table.current_session;
  const isOverTime = session && session.elapsedMinutes > session.expectedDurationMinutes;
  const turnPercent = session ? Math.min(100, Math.round((session.elapsedMinutes / (session.expectedDurationMinutes || 1)) * 100)) : 0;

  const handleAction = async (action: string) => {
    switch (action) {
      case "start_dining":
        await changeTableStatus(table.id, "dining", "Guest started main dining course");
        break;
      case "request_bill":
        await changeTableStatus(table.id, "bill_requested", "Bill presented to table");
        break;
      case "mark_cleaning":
        await markCleaning(table.id);
        break;
      case "mark_available":
        await markAvailable(table.id);
        break;
      case "block_table":
        if (table.status === "blocked") {
          await markAvailable(table.id);
        } else {
          await blockTable(table.id, "Blocked by manager hold");
        }
        break;
      case "open_seat_reservation":
        setModalTargetTable(table);
        setActiveModal("seat_reservation");
        break;
      case "open_seat_walkin":
        setModalTargetTable(table);
        setActiveModal("seat_walkin");
        break;
      case "open_move_guest":
        setModalTargetTable(table);
        setActiveModal("move_guest");
        break;
      default:
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-over Drawer */}
      <div className="w-full max-w-xl bg-zinc-900 border-l border-white/10 h-full overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative font-mono text-xs text-zinc-300">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-white">
                TABLE {table.table_number}
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border bg-zinc-800 text-zinc-300 border-white/10">
                {table.shape} ({table.capacity}p)
              </span>
            </div>
            <div className="text-zinc-400 font-sans text-xs">
              {table.seating_area_name} • {table.display_name || "Standard Dining Station"}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Table State Banner */}
        <div className="p-4 rounded-2xl border flex items-center justify-between bg-zinc-950 border-white/10">
          <div className="space-y-0.5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
              CURRENT LIVE STATE
            </span>
            <div className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                table.status === "available" ? "bg-emerald-400" :
                table.status === "dining" || table.status === "seated" ? "bg-purple-500" :
                table.status === "reserved" ? "bg-blue-400" :
                table.status === "arriving" || table.status === "bill_requested" ? "bg-amber-400" : "bg-zinc-500"
              }`} />
              <span>{table.status.replace("_", " ")}</span>
            </div>
          </div>

          {session && (
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 uppercase">SEATED TIME</span>
              <div className={`text-base font-black ${isOverTime ? "text-rose-400" : "text-purple-300"}`}>
                {session.elapsedMinutes} mins
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Action Progression Bar */}
        <div className="bg-zinc-950 border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
            TABLE OPERATIONAL ACTIONS
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {/* If Available */}
            {table.status === "available" && (
              <>
                <button
                  onClick={() => handleAction("open_seat_walkin")}
                  className="px-3 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow text-center"
                >
                  Seat Walk-In
                </button>
                <button
                  onClick={() => handleAction("open_seat_reservation")}
                  className="px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition-colors text-center"
                >
                  Seat Reservation
                </button>
                <button
                  onClick={() => handleAction("block_table")}
                  className="px-3 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 rounded-xl transition-colors text-center"
                >
                  Block Table
                </button>
              </>
            )}

            {/* If Reserved or Arriving */}
            {(table.status === "reserved" || table.status === "arriving") && (
              <>
                <button
                  onClick={() => handleAction("open_seat_reservation")}
                  className="px-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow text-center col-span-2 sm:col-span-1"
                >
                  Seat Arrived Guest
                </button>
                <button
                  onClick={() => handleAction("open_seat_walkin")}
                  className="px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition-colors text-center"
                >
                  Seat Walk-In
                </button>
                <button
                  onClick={() => handleAction("mark_available")}
                  className="px-3 py-2.5 bg-zinc-900 hover:bg-rose-950 text-rose-300 border border-white/10 rounded-xl transition-colors text-center"
                >
                  Release Hold
                </button>
              </>
            )}

            {/* If Seated or Ordering or Dining */}
            {(table.status === "seated" || table.status === "ordering" || table.status === "dining") && (
              <>
                {table.status !== "dining" && (
                  <button
                    onClick={() => handleAction("start_dining")}
                    className="px-3 py-2.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 font-bold rounded-xl transition-all text-center"
                  >
                    Start Dining
                  </button>
                )}
                <button
                  onClick={() => handleAction("request_bill")}
                  className="px-3 py-2.5 bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/40 font-bold rounded-xl transition-all text-center"
                >
                  Request Bill
                </button>
                <button
                  onClick={() => handleAction("open_move_guest")}
                  className="px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition-colors text-center"
                >
                  Move Table
                </button>
                <button
                  onClick={() => handleAction("mark_cleaning")}
                  className="px-3 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 rounded-xl transition-colors text-center"
                >
                  Clear Table
                </button>
              </>
            )}

            {/* If Bill Requested */}
            {table.status === "bill_requested" && (
              <>
                <button
                  onClick={() => handleAction("mark_cleaning")}
                  className="px-3 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all shadow text-center col-span-2"
                >
                  Bill Paid & Clear Table
                </button>
                <button
                  onClick={() => handleAction("open_move_guest")}
                  className="px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition-colors text-center"
                >
                  Move Table
                </button>
              </>
            )}

            {/* If Cleaning */}
            {table.status === "cleaning" && (
              <button
                onClick={() => handleAction("mark_available")}
                className="px-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow text-center col-span-3"
              >
                Mark Cleaned & Available
              </button>
            )}

            {/* If Blocked */}
            {table.status === "blocked" && (
              <button
                onClick={() => handleAction("block_table")}
                className="px-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow text-center col-span-3"
              >
                Unblock & Make Available
              </button>
            )}
          </div>
        </div>

        {/* Active Guest Session Details */}
        {session && (
          <div className="bg-zinc-950 border border-purple-500/30 rounded-2xl p-4 space-y-3 font-sans text-xs">
            <div className="flex items-center justify-between font-mono">
              <span className="text-[10px] text-purple-300 uppercase tracking-widest font-bold flex items-center gap-1.5">
                <Armchair className="w-3.5 h-3.5 text-purple-400" />
                ACTIVE GUEST SESSION
              </span>
              <span className="text-[11px] text-zinc-400">
                Seated @ {session.seatedAt}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">{session.guestName}</h3>
              <div className="flex flex-wrap items-center gap-3 text-zinc-400 font-mono text-[11px]">
                <span className="text-zinc-200 font-bold flex items-center gap-1">
                  <Users className="w-3 h-3 text-zinc-400" />
                  {session.partySize} Guests
                </span>
                {session.phone && <span>• {session.phone}</span>}
                {session.serverName && <span>• Server: {session.serverName}</span>}
              </div>
            </div>

            {/* Pacing Turn Progress Bar */}
            <div className="space-y-1 pt-1 font-mono">
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>Pacing Progress</span>
                <span className={isOverTime ? "text-rose-400 font-bold" : "text-purple-300"}>
                  {session.elapsedMinutes}m / {session.expectedDurationMinutes}m ({turnPercent}%)
                </span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    isOverTime ? "bg-rose-500" : turnPercent > 75 ? "bg-amber-400" : "bg-purple-500"
                  }`}
                  style={{ width: `${turnPercent}%` }}
                />
              </div>
            </div>

            {/* Special Occasion & Dietary notes */}
            {session.specialOccasion && (
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-200 font-medium">
                Occasion: <strong>{session.specialOccasion}</strong>
              </div>
            )}

            {session.allergies && session.allergies !== "None" && (
              <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Allergy Alert: {session.allergies}</span>
              </div>
            )}

            {session.orderSummaryPlaceholder && (
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-white/5 text-zinc-300 font-sans italic">
                "{session.orderSummaryPlaceholder}"
              </div>
            )}
          </div>
        )}

        {/* Next Reservation on this Table */}
        {table.next_reservation && (
          <div className="bg-zinc-950 border border-blue-500/30 rounded-2xl p-4 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-blue-300">
              <span className="text-[10px] uppercase tracking-widest font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                NEXT RESERVATION DUE
              </span>
              <span className="font-bold text-white bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30">
                {table.next_reservation.reservationTime}
              </span>
            </div>

            <div className="space-y-0.5">
              <div className="font-bold text-white text-sm">
                {table.next_reservation.guestName}
              </div>
              <div className="text-[11px] text-zinc-400 font-sans">
                Party of {table.next_reservation.partySize} Guests • {table.next_reservation.specialOccasion || "Standard Reservation"}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
