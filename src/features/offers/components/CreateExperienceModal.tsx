import React, { useState } from "react";
import { X, Sparkles, Building2, Eye, EyeOff } from "lucide-react";
import { useOffers } from "../context/OffersContext";
import { ExperienceCategory, CreateExperienceInput } from "../types";
import { useOrg } from "../../../context/OrgContext";

export function CreateExperienceModal() {
  const { isCreateExpModalOpen, closeCreateExpModal, createExperience } = useOffers();
  const { currentOrg, currentOutlet } = useOrg();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ExperienceCategory>("tasting");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<"ORG" | "OUTLET">("OUTLET");

  const [isPublic, setIsPublic] = useState(true);
  const [minParty, setMinParty] = useState(2);
  const [maxParty, setMaxParty] = useState(6);
  const [duration, setDuration] = useState(120);

  const [basePrice, setBasePrice] = useState<string>("380");
  const [leadHours, setLeadHours] = useState<number>(24);

  const [selectedDays, setSelectedDays] = useState<number[]>([3, 4, 5, 6, 0]); // Wed - Sun
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("22:30");

  const [guestTerms, setGuestTerms] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isCreateExpModalOpen) return null;

  const daysList = [
    { id: 1, label: "Mon" },
    { id: 2, label: "Tue" },
    { id: 3, label: "Wed" },
    { id: 4, label: "Thu" },
    { id: 5, label: "Fri" },
    { id: 6, label: "Sat" },
    { id: 0, label: "Sun" },
  ];

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;
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
      const input: CreateExperienceInput = {
        organization_id: currentOrg.id,
        outlet_id: scope === "OUTLET" && currentOutlet ? currentOutlet.id : null,
        title: title.trim(),
        category,
        short_description: shortDescription.trim() || null,
        description: description.trim() || null,
        is_public: isPublic,
        minimum_party_size: minParty,
        maximum_party_size: maxParty,
        duration_minutes: duration > 0 ? duration : null,
        base_price: priceVal !== null && !isNaN(priceVal) ? priceVal : null,
        currency_code: "MYR",
        booking_lead_minutes: leadHours * 60,
        availability_days: selectedDays,
        start_time: startTime,
        end_time: endTime,
        guest_terms: guestTerms.trim() || null,
        internal_notes: internalNotes.trim() || null,
      };

      await createExperience(input);
      closeCreateExpModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create experience");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-zinc-900/90">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="font-mono text-base font-black text-white uppercase tracking-tight">
              CREATE HOSPITALITY EXPERIENCE
            </h3>
          </div>
          <button
            onClick={closeCreateExpModal}
            className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 text-rose-300 font-mono text-xs rounded">
              {error}
            </div>
          )}

          {/* Title & Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
                EXPERIENCE TITLE *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Chef's Tasting Menu or Sunset Wine Pairing"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-sans text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
                CATEGORY
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExperienceCategory)}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-mono text-xs text-white focus:outline-none focus:border-purple-500"
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
          </div>

          {/* Scope & Public Visibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-900/60 border border-white/5 p-3 rounded-lg">
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1">
                <Building2 className="w-3 h-3" /> OUTLET SCOPE
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as "ORG" | "OUTLET")}
                className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded font-mono text-xs text-zinc-200"
              >
                <option value="OUTLET">Current Outlet ({currentOutlet?.name || "Selected"})</option>
                <option value="ORG">Organization-wide (All Outlets)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
                VISIBILITY CHANNEL
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

          {/* Party Size, Duration, Price */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                DURATION (MIN)
              </label>
              <input
                type="number"
                step="15"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
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
                placeholder="0.00"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-mono text-xs text-white"
              />
            </div>
          </div>

          {/* Available Days & Hours */}
          <div className="space-y-2 bg-zinc-900/60 border border-white/5 p-3 rounded-lg">
            <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
              AVAILABLE SERVICE DAYS
            </label>
            <div className="flex flex-wrap gap-1.5">
              {daysList.map((d) => {
                const isSelected = selectedDays.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDay(d.id)}
                    className={`px-3 py-1 rounded font-mono text-xs font-bold transition border ${
                      isSelected
                        ? "bg-purple-600 text-white border-purple-500"
                        : "bg-black/40 text-zinc-400 border-white/10 hover:text-white"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <span className="font-mono text-[10px] text-zinc-400">SERVICE START TIME</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded font-mono text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[10px] text-zinc-400">SERVICE END TIME</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded font-mono text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
              MENU DESCRIPTION & HIGHLIGHTS
            </label>
            <textarea
              rows={3}
              placeholder="Describe courses, beverage inclusions, dining atmosphere..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-sans text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Guest Terms & Internal Staff Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
                GUEST TERMS (CANCELLATION & DIETARY)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Dietary notice required 24h prior..."
                value={guestTerms}
                onChange={(e) => setGuestTerms(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-sans text-xs text-white placeholder-zinc-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
                INTERNAL STAFF PACING & SERVICE NOTES
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Notify pastry chef upon seating..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-sans text-xs text-white placeholder-zinc-500"
              />
            </div>
          </div>

          {/* Submit / Cancel Footer */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeCreateExpModal}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-mono text-xs font-semibold transition"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded font-mono text-xs font-bold transition shadow-lg shadow-purple-900/30"
            >
              {isSubmitting ? "SAVING..." : "SAVE EXPERIENCE"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
