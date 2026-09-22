import React, { useState, useEffect } from "react";
import { Reservation, ReservationStatus } from "../types";
import { ReservationStatusBadge } from "./ReservationStatusBadge";
import { ReservationSourceBadge } from "./ReservationSourceBadge";
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Sparkles, 
  AlertTriangle, 
  CreditCard, 
  ShieldCheck, 
  FileText, 
  History, 
  CheckCircle2, 
  UserCheck, 
  Armchair, 
  CheckCheck, 
  XCircle,
  ExternalLink,
  Gift
} from "lucide-react";
import { useReservations } from "../context/ReservationContext";
import { offersService, ReservationExperience, ReservationAddon } from "../../offers";

interface ReservationDetailDrawerProps {
  reservation: Reservation | null;
  onClose: () => void;
}

export function ReservationDetailDrawer({ reservation, onClose }: ReservationDetailDrawerProps) {
  const { changeStatus, cancelReservation, updateReservation } = useReservations();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusNote, setStatusNote] = useState("");
  const [assignedTable, setAssignedTable] = useState(reservation?.assigned_table_label || "");
  const [attachedExperiences, setAttachedExperiences] = useState<ReservationExperience[]>([]);
  const [attachedAddons, setAttachedAddons] = useState<ReservationAddon[]>([]);

  useEffect(() => {
    if (reservation) {
      offersService.getReservationExperiences(reservation.id).then(setAttachedExperiences);
      offersService.getReservationAddons(reservation.id).then(setAttachedAddons);
    }
  }, [reservation]);

  if (!reservation) return null;

  const handleStatusTransition = async (newStatus: ReservationStatus) => {
    try {
      setIsUpdatingStatus(true);
      await changeStatus(reservation.id, newStatus, statusNote || undefined);
      setStatusNote("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleTableSave = async () => {
    await updateReservation(reservation.id, {
      assigned_table_label: assignedTable.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-fadeIn">
      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-over Drawer Panel */}
      <div className="w-full max-w-xl bg-zinc-900 border-l border-white/10 h-full overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative font-mono text-xs text-zinc-300">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                {reservation.external_reference || reservation.id}
              </span>
              <ReservationStatusBadge status={reservation.status} size="md" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              {reservation.guest_name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Progression Bar */}
        <div className="bg-zinc-950 border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold flex items-center justify-between">
            <span>OPERATIONAL STATUS ACTIONS</span>
            {isUpdatingStatus && <span className="text-purple-400 animate-pulse">Updating...</span>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handleStatusTransition("confirmed")}
              disabled={reservation.status === "confirmed" || isUpdatingStatus}
              className="px-3 py-2 bg-zinc-900 hover:bg-emerald-950/40 text-zinc-300 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/40 rounded-xl transition-all disabled:opacity-40 text-center font-bold"
            >
              Confirm
            </button>

            <button
              onClick={() => handleStatusTransition("arrived")}
              disabled={reservation.status === "arrived" || isUpdatingStatus}
              className="px-3 py-2 bg-zinc-900 hover:bg-amber-950/40 text-zinc-300 hover:text-amber-300 border border-white/10 hover:border-amber-500/40 rounded-xl transition-all disabled:opacity-40 text-center font-bold"
            >
              Mark Arrived
            </button>

            <button
              onClick={() => handleStatusTransition("seated")}
              disabled={reservation.status === "seated" || isUpdatingStatus}
              className="px-3 py-2 bg-zinc-900 hover:bg-emerald-950/40 text-zinc-300 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/40 rounded-xl transition-all disabled:opacity-40 text-center font-bold"
            >
              Seat Guest
            </button>

            <button
              onClick={() => handleStatusTransition("completed")}
              disabled={reservation.status === "completed" || isUpdatingStatus}
              className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 rounded-xl transition-all disabled:opacity-40 text-center"
            >
              Complete
            </button>
          </div>

          {reservation.status !== "cancelled" && reservation.status !== "no_show" && (
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <button
                onClick={() => handleStatusTransition("no_show")}
                className="text-[11px] text-zinc-500 hover:text-rose-400 transition-colors"
              >
                Mark No-Show
              </button>
              <button
                onClick={() => handleStatusTransition("cancelled")}
                className="text-[11px] text-rose-400/80 hover:text-rose-300 transition-colors"
              >
                Cancel Booking
              </button>
            </div>
          )}
        </div>

        {/* Schedule & Seating Details */}
        <div className="grid grid-cols-2 gap-3 bg-zinc-950 border border-white/10 rounded-2xl p-4">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase">DATE & TIME</span>
            <div className="font-bold text-white text-sm flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>{reservation.reservation_time} • {reservation.reservation_date}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase">PARTY SIZE</span>
            <div className="font-bold text-white text-sm flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>{reservation.party_size} Guests</span>
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-white/5">
            <span className="text-[10px] text-zinc-500 uppercase">SEATING AREA</span>
            <div className="text-zinc-200 font-sans text-xs">
              {reservation.seating_area_name || "Main Dining Room"}
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-white/5">
            <span className="text-[10px] text-zinc-500 uppercase">ASSIGNED TABLE</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={assignedTable}
                placeholder="e.g. T-14"
                onChange={(e) => setAssignedTable(e.target.value)}
                onBlur={handleTableSave}
                className="w-24 px-2 py-1 bg-zinc-900 border border-white/20 rounded text-amber-400 font-bold text-xs focus:outline-none focus:border-amber-400"
              />
              <span className="text-[10px] text-zinc-500">Auto-saves</span>
            </div>
          </div>
        </div>

        {/* Guest Contact Information */}
        <div className="bg-zinc-950 border border-white/10 rounded-2xl p-4 space-y-2.5">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block">
            GUEST CONTACT DETAILS
          </span>

          <div className="space-y-2 font-sans text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-zinc-400">
                <Phone className="w-3.5 h-3.5 text-zinc-500" />
                <span>Phone:</span>
              </span>
              <a href={`tel:${reservation.phone}`} className="text-white hover:text-purple-300 font-mono">
                {reservation.phone}
              </a>
            </div>

            {reservation.whatsapp && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-zinc-400">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp:</span>
                </span>
                <a 
                  href={`https://wa.me/${reservation.whatsapp.replace(/[^0-9]/g, '')}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-emerald-400 hover:underline font-mono inline-flex items-center gap-1"
                >
                  <span>{reservation.whatsapp}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {reservation.email && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-zinc-400">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Email:</span>
                </span>
                <a href={`mailto:${reservation.email}`} className="text-zinc-300 hover:text-white truncate max-w-[240px]">
                  {reservation.email}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Hospitality Preferences & Notes */}
        <div className="bg-zinc-950 border border-white/10 rounded-2xl p-4 space-y-3 font-sans text-xs">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-semibold block">
            HOSPITALITY PREFERENCES
          </span>

          {reservation.special_occasion && (
            <div className="space-y-1">
              <span className="text-[11px] text-zinc-400 font-medium">Special Occasion:</span>
              <p className="text-purple-300 font-semibold bg-purple-500/10 p-2 rounded-lg border border-purple-500/20">
                {reservation.special_occasion}
              </p>
            </div>
          )}

          {reservation.allergies && reservation.allergies !== "None" && (
            <div className="space-y-1">
              <span className="text-[11px] text-rose-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Allergies & Medical Restrictions:
              </span>
              <p className="text-rose-200 bg-rose-950/40 p-2 rounded-lg border border-rose-500/30">
                {reservation.allergies}
              </p>
            </div>
          )}

          {reservation.dietary_requirements && reservation.dietary_requirements !== "None" && (
            <div className="space-y-1">
              <span className="text-[11px] text-zinc-400">Dietary Preferences:</span>
              <p className="text-zinc-200 bg-zinc-900 p-2 rounded-lg border border-white/5">
                {reservation.dietary_requirements}
              </p>
            </div>
          )}

          {reservation.special_requests && (
            <div className="space-y-1">
              <span className="text-[11px] text-zinc-400">Special Guest Requests:</span>
              <p className="text-zinc-300 italic bg-zinc-900 p-2 rounded-lg border border-white/5">
                "{reservation.special_requests}"
              </p>
            </div>
          )}
        </div>

        {/* Hospitality Experience & Add-Ons (Phase 3H Integration) */}
        <div className="bg-zinc-950 border border-white/10 rounded-2xl p-4 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>EXPERIENCE & CELEBRATION ADD-ONS</span>
            </span>
            <span className="text-[10px] text-purple-400">
              {attachedExperiences.length > 0 ? "PACKAGE ATTACHED" : "STANDARD DINING"}
            </span>
          </div>

          {attachedExperiences.length > 0 ? (
            <div className="space-y-2">
              {attachedExperiences.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-purple-950/30 border border-purple-500/30 p-3 rounded-xl space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{exp.experience_title}</span>
                    <span className="text-purple-300 font-bold">
                      {exp.unit_price_snapshot ? `RM ${exp.unit_price_snapshot}` : "Complimentary"}
                    </span>
                  </div>
                  {exp.guest_notes && (
                    <p className="text-[11px] text-zinc-300 font-sans italic">
                      "{exp.guest_notes}"
                    </p>
                  )}
                  {exp.staff_notes && (
                    <p className="text-[10px] text-amber-300 font-sans">
                      Staff: {exp.staff_notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2.5 bg-zinc-900/60 border border-white/5 rounded-xl text-[11px] text-zinc-500 font-sans">
              No bespoke tasting menu or package attached to this reservation.
            </div>
          )}

          {attachedAddons.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <span className="text-[10px] text-zinc-500 uppercase block">ATTACHED ADD-ONS</span>
              <div className="space-y-1.5">
                {attachedAddons.map((addon) => (
                  <div
                    key={addon.id}
                    className="flex items-center justify-between bg-zinc-900/80 p-2 rounded-lg border border-white/5"
                  >
                    <div>
                      <span className="text-white font-medium">{addon.addon_name}</span>
                      <span className="text-zinc-500 text-[10px] ml-1.5">x{addon.quantity}</span>
                      {addon.notes && (
                        <div className="text-[10px] text-zinc-400 italic">"{addon.notes}"</div>
                      )}
                    </div>
                    <span className="text-purple-300 font-bold">
                      RM {(addon.unit_price_snapshot || 0) * addon.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Channel, Deposit & Audit Info */}
        <div className="bg-zinc-950 border border-white/10 rounded-2xl p-4 space-y-2.5 font-mono text-xs">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block">
            SOURCE CHANNEL & AUDIT
          </span>

          <div className="grid grid-cols-2 gap-2 text-zinc-400 text-[11px]">
            <div>Source: <strong className="text-zinc-200">{reservation.booking_source}</strong></div>
            <div>Duration: <strong className="text-zinc-200">{reservation.expected_duration_minutes} mins</strong></div>
            <div>Deposit: <strong className="text-zinc-200">{reservation.deposit_status.toUpperCase()} ({reservation.deposit_amount ? `RM ${reservation.deposit_amount}` : "RM 0"})</strong></div>
            <div>Created By: <strong className="text-zinc-200">{reservation.created_by || "System"}</strong></div>
          </div>
          <div className="text-[10px] text-zinc-600 truncate pt-1 border-t border-white/5">
            Token: {reservation.reservation_token}
          </div>
        </div>

        {/* Status Transition History Timeline */}
        <div className="bg-zinc-950 border border-white/10 rounded-2xl p-4 space-y-3 font-mono text-xs">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <History className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
              STATUS AUDIT TIMELINE
            </span>
          </div>

          <div className="space-y-3 pl-2 border-l border-white/10">
            {reservation.status_history && reservation.status_history.length > 0 ? (
              reservation.status_history.map((h, idx) => (
                <div key={idx} className="relative pl-3 space-y-0.5">
                  <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-purple-500" />
                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span className="font-bold text-white uppercase">{h.new_status}</span>
                    <span className="text-[10px] text-zinc-500 font-sans">by {h.changed_by || "Staff"}</span>
                  </div>
                  {h.note && (
                    <p className="text-[11px] text-zinc-400 font-sans">{h.note}</p>
                  )}
                  <div className="text-[10px] text-zinc-600">
                    {new Date(h.changed_at).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-zinc-500 text-[11px] font-sans">
                Initial reservation recorded.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
