import React from "react";
import { useReservations } from "../context/ReservationContext";
import { ReservationCard } from "./ReservationCard";
import { ReservationStatusBadge } from "./ReservationStatusBadge";
import { ReservationSourceBadge } from "./ReservationSourceBadge";
import { 
  CalendarCheck, 
  Users, 
  MapPin, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  UserCheck, 
  Armchair, 
  CheckCheck, 
  X, 
  Eye, 
  Inbox,
  AlertCircle,
  RotateCw
} from "lucide-react";
import { Reservation } from "../types";

export function ReservationListView() {
  const { 
    reservations, 
    isLoading, 
    error, 
    refreshReservations, 
    setSelectedReservation,
    changeStatus,
    cancelReservation
  } = useReservations();

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-28 bg-zinc-900 border border-white/5 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-zinc-900 border border-rose-500/30 rounded-2xl text-center space-y-4 font-mono">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white uppercase">UNABLE TO LOAD RESERVATIONS</h3>
        <p className="text-zinc-400 text-xs max-w-md mx-auto font-sans">{error}</p>
        <button
          onClick={() => refreshReservations()}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-12 text-center space-y-4 shadow-xl">
        <Inbox className="w-12 h-12 text-zinc-600 mx-auto" />
        <h3 className="text-lg font-bold text-white font-mono uppercase">NO RESERVATIONS FOUND</h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto font-sans leading-relaxed">
          No bookings match the selected date, status, or filter criteria. Create a new reservation or reset filters to view all entries.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* DESKTOP & TABLET OPERATIONAL TABLE VIEW (Hidden on Mobile) */}
      <div className="hidden lg:block bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-950/80 border-b border-white/10 text-zinc-400 uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Time / Date</th>
                <th className="py-3.5 px-4 font-semibold">Guest Name</th>
                <th className="py-3.5 px-4 font-semibold">Party</th>
                <th className="py-3.5 px-4 font-semibold">Area / Table</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Source</th>
                <th className="py-3.5 px-4 font-semibold">Occasion / Notes</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reservations.map((res: Reservation) => (
                <tr
                  key={res.id}
                  onClick={() => setSelectedReservation(res)}
                  className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                >
                  {/* Time / Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-bold text-white">{res.reservation_time}</div>
                    <div className="text-[10px] text-zinc-500 font-sans">{res.reservation_date}</div>
                  </td>

                  {/* Guest Name & Phone */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white group-hover:text-purple-300 transition-colors">
                      {res.guest_name}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-sans">{res.phone}</div>
                  </td>

                  {/* Party */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 font-bold text-zinc-200">
                      <Users className="w-3.5 h-3.5 text-zinc-400" />
                      {res.party_size}
                    </span>
                  </td>

                  {/* Area / Table */}
                  <td className="py-3.5 px-4">
                    <div className="text-zinc-300 font-sans text-xs truncate max-w-[140px]">
                      {res.seating_area_name || "Unassigned"}
                    </div>
                    <div className={res.assigned_table_label ? "text-amber-400 font-bold text-[11px]" : "text-zinc-500 text-[10px]"}>
                      {res.assigned_table_label ? `Table ${res.assigned_table_label}` : "No Table"}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <ReservationStatusBadge status={res.status} />
                  </td>

                  {/* Source */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <ReservationSourceBadge source={res.booking_source} />
                  </td>

                  {/* Occasion / Dietary */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5 max-w-[180px]">
                      {res.special_occasion ? (
                        <div className="text-[11px] text-purple-300 font-sans truncate font-medium">
                          {res.special_occasion}
                        </div>
                      ) : (
                        <div className="text-[10px] text-zinc-500 font-sans">Standard</div>
                      )}
                      {res.allergies && res.allergies !== "None" && (
                        <div className="text-[10px] text-rose-400 font-sans font-bold truncate">
                          Allergy: {res.allergies}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {/* State-aware action button */}
                      {(res.status === "new" || res.status === "contacted") && (
                        <button
                          onClick={() => changeStatus(res.id, "confirmed", "Confirmed by staff")}
                          className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[11px] font-bold transition-colors"
                        >
                          Confirm
                        </button>
                      )}

                      {res.status === "confirmed" && (
                        <button
                          onClick={() => changeStatus(res.id, "arrived", "Guest arrived")}
                          className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-bold transition-colors"
                        >
                          Arrived
                        </button>
                      )}

                      {res.status === "arrived" && (
                        <button
                          onClick={() => changeStatus(res.id, "seated", "Guest seated")}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] transition-all shadow active:scale-95"
                        >
                          Seat
                        </button>
                      )}

                      {res.status === "seated" && (
                        <button
                          onClick={() => changeStatus(res.id, "completed", "Service complete")}
                          className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/10 rounded-lg text-[11px] transition-colors"
                        >
                          Complete
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedReservation(res)}
                        title="View Full Details"
                        className="p-1 text-zinc-400 hover:text-white rounded hover:bg-white/10"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE & COMPACT VIEW: CARDS (Visible on Mobile & Tablet) */}
      <div className="lg:hidden space-y-3">
        {reservations.map((res: Reservation) => (
          <ReservationCard
            key={res.id}
            reservation={res}
            onSelect={(r) => setSelectedReservation(r)}
          />
        ))}
      </div>
    </div>
  );
}
