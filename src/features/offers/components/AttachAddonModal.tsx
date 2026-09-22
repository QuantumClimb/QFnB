import React, { useState, useEffect } from "react";
import { X, Gift, CheckCircle2 } from "lucide-react";
import { useOffers } from "../context/OffersContext";
import { Reservation } from "../../reservations/types";
import { reservationService } from "../../reservations/services/reservationService";
import { useOrg } from "../../../context/OrgContext";

export function AttachAddonModal() {
  const {
    isAttachAddonModalOpen,
    closeAttachAddonModal,
    attachAddonTargetResId,
    addons,
    attachAddonToReservation,
  } = useOffers();
  const { currentOrg, currentOutlet } = useOrg();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedResId, setSelectedResId] = useState<string>("");
  const [selectedAddonId, setSelectedAddonId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAttachAddonModalOpen) {
      if (attachAddonTargetResId) {
        setSelectedResId(attachAddonTargetResId);
      }
      if (addons.length > 0) {
        setSelectedAddonId(addons[0].id);
      }

      async function loadRes() {
        try {
          const list = await reservationService.listReservations(
            { viewMode: "all" },
            currentOutlet?.id
          );
          const activeList = list.filter(
            (r) => r.status !== "cancelled" && r.status !== "completed" && r.status !== "no_show"
          );
          setReservations(activeList);
          if (!attachAddonTargetResId && activeList.length > 0) {
            setSelectedResId(activeList[0].id);
          }
        } catch (e) {
          console.error(e);
        }
      }
      loadRes();
    }
  }, [isAttachAddonModalOpen, attachAddonTargetResId, addons, currentOutlet?.id]);

  if (!isAttachAddonModalOpen) return null;

  const currentRes = reservations.find((r) => r.id === selectedResId);
  const currentAddon = addons.find((a) => a.id === selectedAddonId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !currentRes || !currentAddon) return;
    setError(null);

    setIsSubmitting(true);
    try {
      await attachAddonToReservation({
        organization_id: currentOrg.id,
        outlet_id: currentRes.outlet_id,
        reservation_id: currentRes.id,
        addon_id: currentAddon.id,
        quantity,
        notes: notes.trim() || null,
      });

      closeAttachAddonModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to attach add-on");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-zinc-900/90">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-purple-400" />
            <h3 className="font-mono text-base font-black text-white uppercase tracking-tight">
              ATTACH ADD-ON TO BOOKING
            </h3>
          </div>
          <button
            onClick={closeAttachAddonModal}
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

          <div className="space-y-1">
            <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
              SELECT RESERVATION *
            </label>
            <select
              value={selectedResId}
              onChange={(e) => setSelectedResId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-mono text-xs text-white"
            >
              {reservations.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.guest_name} • {r.reservation_date} ({r.party_size} pax)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
                ADD-ON ITEM *
              </label>
              <select
                value={selectedAddonId}
                onChange={(e) => setSelectedAddonId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-mono text-xs text-white"
              >
                {addons.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {a.price ? `RM ${a.price}` : "Free"}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
                QUANTITY
              </label>
              <input
                type="number"
                min="1"
                max={currentAddon?.maximum_quantity || 10}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-mono text-xs text-white"
              />
            </div>
          </div>

          {currentAddon && (
            <div className="p-3 bg-zinc-900 border border-white/5 rounded text-xs font-mono flex items-center justify-between">
              <span className="text-zinc-400">Unit Snapshot: RM {currentAddon.price || 0}</span>
              <span className="text-purple-300 font-bold">
                Total: RM {((currentAddon.price || 0) * quantity).toLocaleString()}
              </span>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
              CUSTOM NOTES & WRITING
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Write 'Happy Birthday Sarah' on gold chocolate plaque"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-sans text-xs text-white placeholder-zinc-500"
            />
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeAttachAddonModal}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-mono text-xs font-semibold"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded font-mono text-xs font-bold transition shadow-lg shadow-purple-900/30"
            >
              {isSubmitting ? "ATTACHING..." : "ATTACH ADD-ON"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
