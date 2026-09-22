import React, { useState } from "react";
import { X, Tag, Building2, Eye, EyeOff } from "lucide-react";
import { useOffers } from "../context/OffersContext";
import { CreateOfferInput } from "../types";
import { useOrg } from "../../../context/OrgContext";

export function CreateOfferModal() {
  const { isCreateOfferModalOpen, closeCreateOfferModal, createOffer, experiences } = useOffers();
  const { currentOrg, currentOutlet } = useOrg();

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<"ORG" | "OUTLET">("OUTLET");
  const [isPublic, setIsPublic] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [experienceId, setExperienceId] = useState<string>("");
  const [eligibility, setEligibility] = useState("");
  const [redemption, setRedemption] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isCreateOfferModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;
    setError(null);

    if (!title.trim()) {
      setError("Please enter an offer title");
      return;
    }

    setIsSubmitting(true);
    try {
      const input: CreateOfferInput = {
        organization_id: currentOrg.id,
        outlet_id: scope === "OUTLET" && currentOutlet ? currentOutlet.id : null,
        title: title.trim(),
        short_description: shortDescription.trim() || null,
        description: description.trim() || null,
        is_public: isPublic,
        is_featured: isFeatured,
        experience_id: experienceId ? experienceId : null,
        eligibility_notes: eligibility.trim() || null,
        redemption_notes: redemption.trim() || null,
        internal_notes: internalNotes.trim() || null,
      };

      await createOffer(input);
      closeCreateOfferModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create offer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-zinc-900/90">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-purple-400" />
            <h3 className="font-mono text-base font-black text-white uppercase tracking-tight">
              CREATE HOSPITALITY OFFER
            </h3>
          </div>
          <button
            onClick={closeCreateOfferModal}
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
              OFFER TITLE *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Weekday Tasting Privilege or Anniversary Toast"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-sans text-xs text-white placeholder-zinc-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 bg-zinc-900/60 border border-white/5 p-3 rounded-lg">
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1">
                <Building2 className="w-3 h-3" /> OUTLET SCOPE
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as "ORG" | "OUTLET")}
                className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded font-mono text-xs text-zinc-200"
              >
                <option value="OUTLET">Current Outlet</option>
                <option value="ORG">Organization-wide</option>
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
                  className={`flex items-center gap-1 px-2.5 py-1 rounded font-mono text-xs border ${
                    isPublic
                      ? "bg-emerald-950 border-emerald-500/40 text-emerald-300 font-bold"
                      : "bg-black/30 border-white/5 text-zinc-500"
                  }`}
                >
                  <Eye className="w-3 h-3" /> PUBLIC
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded font-mono text-xs border ${
                    !isPublic
                      ? "bg-amber-950 border-amber-500/40 text-amber-300 font-bold"
                      : "bg-black/30 border-white/5 text-zinc-500"
                  }`}
                >
                  <EyeOff className="w-3 h-3" /> STAFF ONLY
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
              LINKED EXPERIENCE (OPTIONAL)
            </label>
            <select
              value={experienceId}
              onChange={(e) => setExperienceId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-mono text-xs text-white"
            >
              <option value="">No specific experience (General dining offer)</option>
              {experiences.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
              SHORT DESCRIPTION
            </label>
            <textarea
              rows={2}
              placeholder="Summary of perks or promotional benefit..."
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-sans text-xs text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
              ELIGIBILITY & REDEMPTION INSTRUCTIONS
            </label>
            <input
              type="text"
              placeholder="e.g. Min 2 guests, seated before 18:30"
              value={eligibility}
              onChange={(e) => setEligibility(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-900 border border-white/10 rounded font-sans text-xs text-white mb-2"
            />
            <input
              type="text"
              placeholder="e.g. Present glass of botanical aperitif upon seating"
              value={redemption}
              onChange={(e) => setRedemption(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-900 border border-white/10 rounded font-sans text-xs text-white"
            />
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeCreateOfferModal}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-mono text-xs font-semibold"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded font-mono text-xs font-bold transition shadow-lg shadow-purple-900/30"
            >
              {isSubmitting ? "SAVING..." : "SAVE OFFER"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
