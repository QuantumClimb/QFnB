import React from "react";
import {
  CalendarCheck,
  Sparkles,
  Gift,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { useOffers } from "../context/OffersContext";
import { ReservationExperienceStatus } from "../types";

export function ReservationBookingsView() {
  const {
    reservationExperiences,
    reservationAddons,
    isLoading,
    openAttachExpModal,
    openAttachAddonModal,
    updateReservationExperienceStatus,
    removeExperienceFromReservation,
    removeAddonFromReservation,
  } = useOffers();

  if (isLoading) {
    return (
      <div className="p-12 text-center text-zinc-500 font-mono text-xs">
        LOADING EXPERIENCE ATTACHMENTS...
      </div>
    );
  }

  const activeExperiences = reservationExperiences.filter((re) => re.status !== "cancelled");

  if (activeExperiences.length === 0) {
    return (
      <div className="p-12 bg-zinc-900 border border-white/10 text-center rounded-lg space-y-4">
        <CalendarCheck className="w-10 h-10 text-purple-400 mx-auto opacity-70" />
        <h3 className="text-base font-bold text-white uppercase font-mono">
          NO RESERVATION EXPERIENCES ATTACHED
        </h3>
        <p className="text-zinc-400 font-sans text-xs max-w-md mx-auto">
          No guests currently have hospitality experiences or tasting menus attached to their upcoming bookings.
        </p>
        <button
          onClick={() => openAttachExpModal()}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-mono text-xs font-bold transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>ATTACH EXPERIENCE</span>
        </button>
      </div>
    );
  }

  const getStatusBadge = (status: ReservationExperienceStatus) => {
    switch (status) {
      case "confirmed":
        return "bg-emerald-950 text-emerald-300 border-emerald-500/30";
      case "pending":
        return "bg-amber-950 text-amber-300 border-amber-500/30";
      case "fulfilled":
        return "bg-purple-950 text-purple-300 border-purple-500/30";
      case "cancelled":
        return "bg-rose-950 text-rose-300 border-rose-500/30 line-through";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-mono text-xs text-zinc-400">
          Showing <span className="text-white font-bold">{activeExperiences.length}</span> active experience bookings
        </div>
        <button
          onClick={() => openAttachExpModal()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded font-mono text-xs font-bold transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>ATTACH TO ANOTHER RESERVATION</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {activeExperiences.map((re) => {
          // Find any add-ons for this same reservation
          const linkedAddons = reservationAddons.filter(
            (ra) => ra.reservation_id === re.reservation_id
          );

          return (
            <div
              key={re.id}
              className="bg-zinc-900 border border-white/10 p-5 rounded-lg space-y-4 transition hover:border-white/20"
            >
              {/* Header: Guest Name, Schedule, Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-900/60 border border-purple-500/30 flex items-center justify-center font-mono font-bold text-sm text-purple-300">
                    {re.guest_name ? re.guest_name.charAt(0) : "G"}
                  </div>
                  <div>
                    <h4 className="font-mono text-base font-bold text-white flex items-center gap-2">
                      <span>{re.guest_name || "Guest Booking"}</span>
                      <span className="text-xs text-zinc-400 font-normal">
                        ({re.party_size || 2} guests)
                      </span>
                    </h4>
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mt-0.5">
                      <span className="text-purple-300 font-semibold">{re.reservation_date}</span>
                      <span>•</span>
                      <span>{re.reservation_time}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-[10px] font-bold uppercase px-2.5 py-1 rounded border ${getStatusBadge(
                      re.status
                    )}`}
                  >
                    {re.status}
                  </span>

                  <select
                    value={re.status}
                    onChange={(e) =>
                      updateReservationExperienceStatus(
                        re.id,
                        e.target.value as ReservationExperienceStatus
                      )
                    }
                    className="bg-black/40 border border-white/10 text-zinc-300 font-mono text-[11px] rounded px-2 py-1 focus:outline-none focus:border-purple-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="fulfilled">Fulfilled</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Main: Attached Experience info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="font-mono text-sm font-bold text-white">
                      {re.experience_title}
                    </span>
                    {re.experience_category && (
                      <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/10">
                        {re.experience_category}
                      </span>
                    )}
                  </div>

                  {re.guest_notes && (
                    <div className="text-xs font-sans text-zinc-300 bg-black/40 p-2.5 rounded border border-white/5">
                      <span className="font-mono text-[10px] text-zinc-500 block uppercase font-bold">
                        GUEST REQUEST:
                      </span>
                      {re.guest_notes}
                    </div>
                  )}

                  {re.staff_notes && (
                    <div className="text-xs font-sans text-amber-200 bg-amber-950/20 p-2.5 rounded border border-amber-500/20">
                      <span className="font-mono text-[10px] text-amber-400 block uppercase font-bold">
                        STAFF INSTRUCTIONS:
                      </span>
                      {re.staff_notes}
                    </div>
                  )}
                </div>

                {/* Price Snapshot & Detach */}
                <div className="bg-zinc-950 p-3 rounded border border-white/5 flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-zinc-500 uppercase block">
                      PRICE SNAPSHOT (PER GUEST / PKG)
                    </span>
                    <span className="font-mono text-base font-black text-white mt-1 block">
                      {re.unit_price_snapshot !== null && re.unit_price_snapshot !== undefined
                        ? `RM ${re.unit_price_snapshot}`
                        : "Complimentary / Custom"}
                    </span>
                    <span className="font-mono text-[10px] text-purple-400 mt-1 block">
                      Quantity: {re.quantity}
                    </span>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => removeExperienceFromReservation(re.id)}
                      className="text-zinc-500 hover:text-rose-400 font-mono text-[11px] flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3 h-3" /> Detach Package
                    </button>
                  </div>
                </div>
              </div>

              {/* Add-ons linked to this reservation */}
              <div className="pt-3 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-400">
                    <Gift className="w-3.5 h-3.5 text-purple-400" />
                    <span>ATTACHED ADD-ONS ({linkedAddons.length})</span>
                  </div>
                  <button
                    onClick={() => openAttachAddonModal(re.reservation_id)}
                    className="text-purple-400 hover:text-purple-300 font-mono text-[11px] flex items-center gap-1 font-bold"
                  >
                    <Plus className="w-3 h-3" /> Add Cake / Flowers
                  </button>
                </div>

                {linkedAddons.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {linkedAddons.map((addon) => (
                      <div
                        key={addon.id}
                        className="bg-black/40 border border-white/5 p-2.5 rounded flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-white">
                            {addon.addon_name} (x{addon.quantity})
                          </span>
                          {addon.notes && (
                            <span className="text-[11px] text-zinc-400 block italic">
                              "{addon.notes}"
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-purple-300 font-bold">
                            RM {(addon.unit_price_snapshot || 0) * addon.quantity}
                          </span>
                          <button
                            onClick={() => removeAddonFromReservation(addon.id)}
                            className="text-zinc-600 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] font-mono text-zinc-500 italic">
                    No celebration add-ons currently attached to this booking.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
