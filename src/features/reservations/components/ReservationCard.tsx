import React from "react";
import { Reservation } from "../types";
import { ReservationStatusBadge } from "./ReservationStatusBadge";
import { ReservationSourceBadge } from "./ReservationSourceBadge";
import { 
  Clock, 
  Users, 
  MapPin, 
  Sparkles, 
  Phone, 
  AlertTriangle, 
  CheckCircle2, 
  UserCheck, 
  Armchair, 
  CheckCheck, 
  X, 
  Eye 
} from "lucide-react";
import { useReservations } from "../context/ReservationContext";

interface ReservationCardProps {
  reservation: Reservation;
  onSelect: (r: Reservation) => void;
}

export function ReservationCard({ reservation, onSelect }: ReservationCardProps) {
  const { changeStatus, cancelReservation } = useReservations();

  const handleAction = async (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    switch (action) {
      case "confirm":
        await changeStatus(reservation.id, "confirmed", "Confirmed by staff");
        break;
      case "arrive":
        await changeStatus(reservation.id, "arrived", "Guest arrived at host stand");
        break;
      case "seat":
        await changeStatus(reservation.id, "seated", "Guest seated at table");
        break;
      case "complete":
        await changeStatus(reservation.id, "completed", "Dining service completed");
        break;
      case "cancel":
        if (window.confirm(`Cancel reservation for ${reservation.guest_name}?`)) {
          await cancelReservation(reservation.id, "Cancelled by staff request");
        }
        break;
      default:
        break;
    }
  };

  return (
    <div
      onClick={() => onSelect(reservation)}
      className="bg-zinc-950 border border-white/10 hover:border-purple-500/40 rounded-2xl p-4 sm:p-5 transition-all cursor-pointer shadow-lg space-y-3.5 group relative"
    >
      {/* Top row: Time, Status, Source */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-black text-white px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/10">
            {reservation.reservation_time}
          </span>
          <span className="text-[11px] font-mono text-zinc-400">
            {reservation.reservation_date}
          </span>
          <ReservationStatusBadge status={reservation.status} />
        </div>

        <ReservationSourceBadge source={reservation.booking_source} />
      </div>

      {/* Middle row: Guest name & Party info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-purple-300 transition-colors">
              {reservation.guest_name}
            </h3>
            <span className="inline-flex items-center gap-1 font-mono text-xs text-zinc-300 font-semibold px-2 py-0.5 rounded bg-zinc-900 border border-white/10">
              <Users className="w-3.5 h-3.5 text-zinc-400" />
              {reservation.party_size} Guests
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 font-mono">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-zinc-500" />
              {reservation.seating_area_name || "Unassigned Area"}
            </span>
            <span className="text-zinc-600">•</span>
            <span className={reservation.assigned_table_label ? "text-amber-400 font-bold" : "text-zinc-500"}>
              {reservation.assigned_table_label ? `Table ${reservation.assigned_table_label}` : "Table Not Assigned"}
            </span>
            <span className="text-zinc-600">•</span>
            <span>~{reservation.expected_duration_minutes} mins</span>
          </div>
        </div>

        {/* Deposit badge if applicable */}
        {reservation.deposit_status === "paid" && (
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded self-start sm:self-center">
            Deposit Paid RM {reservation.deposit_amount}
          </span>
        )}
      </div>

      {/* Occasion & Dietary alerts */}
      {(reservation.special_occasion || reservation.allergies || reservation.dietary_requirements) && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {reservation.special_occasion && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-[10px] text-purple-300 font-sans">
              <Sparkles className="w-3 h-3 text-purple-400" />
              {reservation.special_occasion}
            </span>
          )}
          {reservation.allergies && reservation.allergies !== "None" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-[10px] text-rose-300 font-sans font-bold">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              Allergy: {reservation.allergies}
            </span>
          )}
          {reservation.dietary_requirements && reservation.dietary_requirements !== "None" && (
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-white/10 text-[10px] text-zinc-300 font-sans">
              {reservation.dietary_requirements}
            </span>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10 font-mono text-xs">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(reservation);
          }}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-[11px] transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Details</span>
        </button>

        <div className="flex items-center gap-2">
          {/* State-aware transition actions */}
          {(reservation.status === "new" || reservation.status === "contacted") && (
            <button
              onClick={(e) => handleAction(e, "confirm")}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs transition-colors font-bold"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Confirm</span>
            </button>
          )}

          {reservation.status === "confirmed" && (
            <button
              onClick={(e) => handleAction(e, "arrive")}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs transition-colors font-bold"
            >
              <UserCheck className="w-3 h-3" />
              <span>Mark Arrived</span>
            </button>
          )}

          {reservation.status === "arrived" && (
            <button
              onClick={(e) => handleAction(e, "seat")}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all shadow-md active:scale-95"
            >
              <Armchair className="w-3 h-3" />
              <span>Seat Table</span>
            </button>
          )}

          {reservation.status === "seated" && (
            <button
              onClick={(e) => handleAction(e, "complete")}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/15 rounded-lg text-xs transition-colors"
            >
              <CheckCheck className="w-3 h-3 text-emerald-400" />
              <span>Complete</span>
            </button>
          )}

          {/* Cancellation button for active reservations */}
          {reservation.status !== "completed" && reservation.status !== "cancelled" && reservation.status !== "no_show" && (
            <button
              onClick={(e) => handleAction(e, "cancel")}
              title="Cancel reservation"
              className="p-1.5 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-300 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
