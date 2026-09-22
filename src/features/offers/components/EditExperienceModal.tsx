import React, { useState, useEffect } from "react";
import { X, Sparkles, Eye, EyeOff } from "lucide-react";
import { useOffers } from "../context/OffersContext";
import { ExperienceCategory, UpdateExperienceInput } from "../types";

export function EditExperienceModal() {
  const { isEditExpModalOpen, closeEditExpModal, selectedExperience, updateExperience } = useOffers();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ExperienceCategory>("tasting");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [minParty, setMinParty] = useState(2);
  const [maxParty, setMaxParty] = useState(6);
  const [duration, setDuration] = useState(120);
  const [basePrice, setBasePrice] = useState<string>("380");
  const [guestTerms, setGuestTerms] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedExperience) {
      setTitle(selectedExperience.title || "");
      setCategory(selectedExperience.category || "tasting");
      setShortDescription(selectedExperience.short_description || "");
      setDescription(selectedExperience.description || "");
      setIsPublic(selectedExperience.is_public);
      setMinParty(selectedExperience.minimum_party_size || 2);
      setMaxParty(selectedExperience.maximum_party_size || 6);
      setDuration(selectedExperience.duration_minutes || 120);
      setBasePrice(
        selectedExperience.base_price !== null && selectedExperience.base_price !== undefined
          ? selectedExperience.base_price.toString()
          : ""
      );
      setGuestTerms(selectedExperience.guest_terms || "");
      setInternalNotes(selectedExperience.internal_notes || "");
    }
  }, [selectedExperience]);

  if (!isEditExpModalOpen || !selectedExperience) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Please enter an experience title");
      return;
    }
    if (minParty <= 0) {
      setError("Minimum party size must be at least 1");
      return;
    }
    if (maxParty < minParty) {
      setError("Maximum party size must be greater than or equal to minimum");
      return;
    }

    setIsSubmitting(true);
    try {
      const priceVal = basePrice ? parseFloat(basePrice) : null;
      const input: UpdateExperienceInput = {
        title: title.trim(),
        category,
        short_description: shortDescription.trim() || null,
        description: description.trim() || null,
        is_public: isPublic,
        minimum_party_size: minParty,
        maximum_party_size: maxParty,
        duration_minutes: duration > 0 ? duration : null,
        base_price: priceVal !== null && !isNaN(priceVal) ? priceVal : null,
        guest_terms: guestTerms.trim() || null,
        internal_notes: internalNotes.trim() || null,
      };

      await updateExperience(selectedExperience.id, input);
      closeEditExpModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update experience");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-zinc-950 border border-white/10 rounded-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-zinc-900/90">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="font-mono text-base font-black text-white uppercase tracking-tight">
              EDIT EXPERIENCE CATALOGUE
            </h3>
          </div>
          <button
            onClick={closeEditExpModal}
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

          <div className="p-3 bg-zinc-900/50 border border-white/5 rounded text-xs font-mono text-zinc-400">
            Notice: Modifying future catalogue prices will <span className="text-purple-300 font-bold">never</span> alter price snapshots on existing confirmed bookings.
          </div>

          <div className="space-y-1">
            <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
              EXPERIENCE TITLE *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-sans text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
                CATEGORY
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExperienceCategory)}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-mono text-xs text-white"
              >
                <option value="tasting">Tasting Menu</option>
                <option value="celebration">Celebration</option>
                <option value="romantic">Romantic</option>
                <option value="wine">Wine Pairing</option>
                <option value="private_dining">Private Dining</option>
                <option value="live_entertainment">Live Entertainment</option>
                <option value="corporate">Corporate</option>
                <option value="family">Family</option>
                <option value="seasonal">Seasonal</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
                VISIBILITY
              </label>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex items-center gap-1 px-3 py-1 rounded font-mono text-xs font-semibold border ${
                    isPublic
                      ? "bg-emerald-950 border-emerald-500/40 text-emerald-300"
                      : "bg-black/30 border-white/5 text-zinc-500"
                  }`}
                >
                  <Eye className="w-3 h-3" /> PUBLIC
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`flex items-center gap-1 px-3 py-1 rounded font-mono text-xs font-semibold border ${
                    !isPublic
                      ? "bg-amber-950 border-amber-500/40 text-amber-300"
                      : "bg-black/30 border-white/5 text-zinc-500"
                  }`}
                >
                  <EyeOff className="w-3 h-3" /> STAFF ONLY
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
                MIN PARTY
              </label>
              <input
                type="number"
                min="1"
                value={minParty}
                onChange={(e) => setMinParty(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-mono text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
                MAX PARTY
              </label>
              <input
                type="number"
                min="1"
                value={maxParty}
                onChange={(e) => setMaxParty(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-mono text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
                BASE PRICE (MYR)
              </label>
              <input
                type="number"
                step="0.01"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-mono text-xs text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
              DESCRIPTION
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-sans text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
                GUEST TERMS
              </label>
              <textarea
                rows={2}
                value={guestTerms}
                onChange={(e) => setGuestTerms(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-sans text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
                INTERNAL STAFF NOTES
              </label>
              <textarea
                rows={2}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-sans text-xs text-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeEditExpModal}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-mono text-xs font-semibold transition"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded font-mono text-xs font-bold transition shadow-lg shadow-purple-900/30"
            >
              {isSubmitting ? "UPDATING..." : "UPDATE EXPERIENCE"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
