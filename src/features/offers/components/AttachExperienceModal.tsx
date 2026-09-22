import React, { useState, useEffect } from "react";
import { X, CalendarCheck, CheckCircle2, AlertTriangle, Users, Clock, Building2 } from "lucide-react";
import { useOffers } from "../context/OffersContext";
import { Reservation } from "../../reservations/types";
import { reservationService } from "../../reservations/services/reservationService";
import { Experience, ExperienceCompatibilityResult } from "../types";
import { useOrg } from "../../../context/OrgContext";

export function AttachExperienceModal() {
  const {
    isAttachExpModalOpen,
    closeAttachExpModal,
    attachExpTarget,
    experiences,
    attachExperienceToReservation,
    checkCompatibility,
  } = useOffers();
  const { currentOrg, currentOutlet } = useOrg();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedResId, setSelectedResId] = useState<string>("");
  const [selectedExpId, setSelectedExpId] = useState<string>("");

  const [quantity, setQuantity] = useState<number>(1);
  const [guestNotes, setGuestNotes] = useState<string>("");
  const [staffNotes, setStaffNotes] = useState<string>("");

  const [compatibility, setCompatibility] = useState<ExperienceCompatibilityResult | null>(null);
  const [isLoadingRes, setIsLoadingRes] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAttachExpModalOpen) {
      if (attachExpTarget) {
        setSelectedExpId(attachExpTarget.id);
      } else if (experiences.length > 0) {
        setSelectedExpId(experiences[0].id);
      }

      async function loadReservations() {
        setIsLoadingRes(true);
        try {
          const list = await reservationService.listReservations(
            { viewMode: "all" },
            currentOutlet?.id
          );
          // Only show active / upcoming reservations
          const activeList = list.filter(
            (r) => r.status !== "cancelled" && r.status !== "completed" && r.status !== "no_show"
          );
          setReservations(activeList);
          if (activeList.length > 0) {
            setSelectedResId(activeList[0].id);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoadingRes(false);
        }
      }

      loadReservations();
    }
  }, [isAttachExpModalOpen, attachExpTarget, experiences, currentOutlet?.id]);

  // Run compatibility check whenever selectedResId or selectedExpId changes
  useEffect(() => {
    async function evaluate() {
      if (!selectedResId || !selectedExpId) {
        setCompatibility(null);
        return;
      }
      const res = reservations.find((r) => r.id === selectedResId);
      if (!res) return;

      const result = await checkCompatibility(selectedExpId, {
        party_size: res.party_size,
        reservation_date: res.reservation_date,
        reservation_time: res.reservation_time,
        outlet_id: res.outlet_id,
      });

      setCompatibility(result);
    }

    evaluate();
  }, [selectedResId, selectedExpId, reservations, checkCompatibility]);

  if (!isAttachExpModalOpen) return null;

  const currentRes = reservations.find((r) => r.id === selectedResId);
  const currentExp = experiences.find((e) => e.id === selectedExpId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !currentRes || !currentExp) return;
    setError(null);

    if (compatibility && !compatibility.isCompatible) {
      setError("Cannot attach incompatible experience. Please review incompatibility reasons.");
      return;
    }

    setIsSubmitting(true);
    try {
      await attachExperienceToReservation({
        organization_id: currentOrg.id,
        outlet_id: currentRes.outlet_id,
        reservation_id: currentRes.id,
        experience_id: currentExp.id,
        quantity,
        guest_notes: guestNotes.trim() || null,
        staff_notes: staffNotes.trim() || null,
      });

      closeAttachExpModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to attach experience");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-zinc-950 border border-white/10 rounded-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-zinc-900/90">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-purple-400" />
            <h3 className="font-mono text-base font-black text-white uppercase tracking-tight">
              ATTACH EXPERIENCE TO RESERVATION
            </h3>
          </div>
          <button
            onClick={closeAttachExpModal}
            className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 text-rose-300 font-mono text-xs rounded">
              {error}
            </div>
          )}

          {/* Reservation Selector */}
          <div className="space-y-1">
            <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
              SELECT RESERVATION *
            </label>
            {isLoadingRes ? (
              <div className="p-2 text-zinc-500 font-mono text-xs">Loading reservations...</div>
            ) : reservations.length === 0 ? (
              <div className="p-3 bg-zinc-900 text-zinc-400 font-mono text-xs rounded border border-white/5">
                No active reservations available in this outlet.
              </div>
            ) : (
              <select
                value={selectedResId}
                onChange={(e) => setSelectedResId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-mono text-xs text-white"
              >
                {reservations.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.guest_name} • {r.reservation_date} at {r.reservation_time} • {r.party_size} pax ({r.status.toUpperCase()})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Experience Selector */}
          <div className="space-y-1">
            <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
              HOSPITALITY EXPERIENCE *
            </label>
            <select
              value={selectedExpId}
              onChange={(e) => setSelectedExpId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-mono text-xs text-white"
            >
              {experiences.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.title} ({exp.minimum_party_size}–{exp.maximum_party_size} pax) — {exp.base_price ? `RM ${exp.base_price}` : "Free / A La Carte"}
                </option>
              ))}
            </select>
          </div>

          {/* Compatibility Engine Feedback */}
          {currentRes && currentExp && (
            <div className="space-y-2">
              <div className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
                COMPATIBILITY EVALUATION
              </div>
              {compatibility ? (
                compatibility.isCompatible ? (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg flex items-start gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-mono font-bold text-emerald-300">
                        COMPATIBLE BOOKING
                      </div>
                      <div className="text-zinc-300 font-sans text-[11px] mt-0.5">
                        Party size ({currentRes.party_size} pax) matches {currentExp.minimum_party_size}–{currentExp.maximum_party_size} pax bounds. Outlet & scheduling validated.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-lg flex items-start gap-2 text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-mono font-bold text-rose-300">
                        INCOMPATIBLE SELECTION
                      </div>
                      <ul className="text-rose-200 font-sans text-[11px] mt-1 space-y-0.5 list-disc list-inside">
                        {compatibility.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              ) : (
                <div className="p-2 text-xs text-zinc-500 font-mono">Evaluating...</div>
              )}
            </div>
          )}

          {/* Historical Price Snapshot preview */}
          {currentExp && (
            <div className="p-3 bg-zinc-900 border border-white/5 rounded-lg flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-zinc-500 block text-[10px]">HISTORICAL PRICE SNAPSHOT</span>
                <span className="text-white font-bold">
                  {currentExp.base_price !== null && currentExp.base_price !== undefined
                    ? `RM ${currentExp.base_price}`
                    : "RM 0 (Complimentary)"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-zinc-500 block text-[10px]">IMMUTABILITY</span>
                <span className="text-purple-300 font-semibold">Audit Snapshot Locked</span>
              </div>
            </div>
          )}

          {/* Quantity & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
                GUEST REQUESTS & PREFERENCES
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Celebrating Sarah's 30th birthday"
                value={guestNotes}
                onChange={(e) => setGuestNotes(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-sans text-xs text-white placeholder-zinc-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
                STAFF / KITCHEN INSTRUCTIONS
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Prepare dessert sparkler at 20:45"
                value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-sans text-xs text-white placeholder-zinc-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeAttachExpModal}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-mono text-xs font-semibold"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (compatibility !== null && !compatibility.isCompatible)}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded font-mono text-xs font-bold transition shadow-lg shadow-purple-900/30"
            >
              {isSubmitting ? "ATTACHING..." : "CONFIRM ATTACHMENT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
