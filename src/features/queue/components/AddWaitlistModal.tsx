import React, { useState, useEffect } from "react";
import { 
  X, 
  Users, 
  Clock, 
  Phone, 
  User, 
  MapPin, 
  Sparkles, 
  Tag, 
  AlertCircle,
  Award,
  Cake,
  Baby
} from "lucide-react";
import { useQueue } from "../context/QueueContext";
import { WaitlistPriorityTag, WaitlistSource } from "../types";
import { queueService } from "../services/queueService";

const PARTY_PRESETS = [1, 2, 3, 4, 5, 6, 8];
const QUOTE_PRESETS = [10, 15, 20, 30, 45, 60];

const SEATING_AREAS = [
  { id: "", label: "Any Available Zone" },
  { id: "area-main", label: "Main Dining" },
  { id: "area-terrace", label: "Alfresco Terrace" },
  { id: "area-bar", label: "Cocktail Bar" },
  { id: "area-pdr", label: "Private Dining Suite" },
];

const TAG_OPTIONS: { id: WaitlistPriorityTag; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "VIP", label: "VIP", icon: Award },
  { id: "HOTEL_GUEST", label: "Hotel Guest", icon: Sparkles },
  { id: "ACCESSIBILITY", label: "Wheelchair / Ground", icon: AlertCircle },
  { id: "BIRTHDAY", label: "Birthday", icon: Cake },
  { id: "HIGH_CHAIR", label: "High Chair", icon: Baby },
];

export function AddWaitlistModal() {
  const { isAddModalOpen, closeAddModal, addEntry } = useQueue();

  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [partySize, setPartySize] = useState<number>(2);
  const [preferredAreaId, setPreferredAreaId] = useState<string>("");
  const [quotedWait, setQuotedWait] = useState<number>(15);
  const [estimatedWaitPreview, setEstimatedWaitPreview] = useState<number>(15);
  const [estimationBasis, setEstimationBasis] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<WaitlistPriorityTag[]>([]);
  const [specialOccasion, setSpecialOccasion] = useState("");
  const [dietaryRequirements, setDietaryRequirements] = useState("");
  const [allergies, setAllergies] = useState("");
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState<WaitlistSource>("walk_in");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Recalculate deterministic estimate when party size or area changes
  useEffect(() => {
    let isMounted = true;
    const updateEstimate = async () => {
      try {
        const est = await queueService.estimateWait(partySize, preferredAreaId || undefined);
        if (isMounted) {
          setEstimatedWaitPreview(est.estimatedWaitMinutes);
          setEstimationBasis(est.basis);
          if (quotedWait === 15) {
            setQuotedWait(est.estimatedWaitMinutes);
          }
        }
      } catch (err) {
        console.error("Failed to estimate wait:", err);
      }
    };
    if (isAddModalOpen) {
      updateEstimate();
    }
    return () => {
      isMounted = false;
    };
  }, [partySize, preferredAreaId, isAddModalOpen]);

  const toggleTag = (tag: WaitlistPriorityTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setErrorMsg("Please enter guest name");
      return;
    }
    if (!phone.trim()) {
      setErrorMsg("Please enter guest contact number");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      await addEntry({
        guest_name: guestName.trim(),
        phone: phone.trim(),
        whatsapp: phone.trim(),
        party_size: partySize,
        preferred_seating_area_id: preferredAreaId || undefined,
        quoted_wait_minutes: quotedWait,
        notes: notes.trim() || undefined,
        special_occasion: specialOccasion.trim() || undefined,
        dietary_requirements: dietaryRequirements ? dietaryRequirements.split(",").map((s) => s.trim()) : undefined,
        allergies: allergies ? allergies.split(",").map((s) => s.trim()) : undefined,
        priority_tags: selectedTags.length > 0 ? selectedTags : undefined,
        source,
      });

      // Reset & Close
      setGuestName("");
      setPhone("");
      setPartySize(2);
      setSelectedTags([]);
      setNotes("");
      setSpecialOccasion("");
      setDietaryRequirements("");
      setAllergies("");
      closeAddModal();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to add guest to waitlist");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAddModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-zinc-950/50">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-amber-400" />
            <h2 className="font-mono text-base font-black text-white uppercase tracking-wider">
              Add Guest To Waitlist
            </h2>
          </div>
          <button
            onClick={closeAddModal}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Party Size Quick Selector */}
          <div>
            <label className="block text-zinc-400 font-mono text-xs uppercase mb-2">
              Party Size *
            </label>
            <div className="grid grid-cols-7 gap-2">
              {PARTY_PRESETS.map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setPartySize(num)}
                  className={`py-3 rounded-xl font-mono text-base font-black transition-all active:scale-95 cursor-pointer ${
                    partySize === num
                      ? "bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20 ring-2 ring-amber-400"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                  }`}
                >
                  {num}
                  {num === 8 ? "+" : ""}
                </button>
              ))}
            </div>
          </div>

          {/* Guest Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 font-mono text-xs uppercase mb-1.5">
                Guest Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Jason Lee"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-zinc-800 border border-white/10 text-white text-sm font-sans rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 font-mono text-xs uppercase mb-1.5">
                Phone / WhatsApp *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  required
                  placeholder="+60 12-345 6789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-zinc-800 border border-white/10 text-white text-sm font-mono rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Quoted Wait & Deterministic Estimation */}
          <div className="bg-zinc-950/60 border border-white/5 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-zinc-300 font-mono text-xs uppercase flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Quoted Wait Time (Minutes)
              </label>
              <span className="text-[11px] font-mono text-amber-400 font-bold">
                Est: ~{estimatedWaitPreview} min
              </span>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {QUOTE_PRESETS.map((mins) => (
                <button
                  type="button"
                  key={mins}
                  onClick={() => setQuotedWait(mins)}
                  className={`py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                    quotedWait === mins
                      ? "bg-amber-400 text-zinc-950 shadow"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>

            {estimationBasis && (
              <p className="text-[11px] font-mono text-zinc-500">
                ⚡ Basis: {estimationBasis}
              </p>
            )}
          </div>

          {/* Seating Area Preference & Intake Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 font-mono text-xs uppercase mb-1.5">
                Preferred Seating Zone
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={preferredAreaId}
                  onChange={(e) => setPreferredAreaId(e.target.value)}
                  className="w-full bg-zinc-800 border border-white/10 text-white text-xs font-mono rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  {SEATING_AREAS.map((area) => (
                    <option key={area.id} value={area.id} className="bg-zinc-900 text-white">
                      {area.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 font-mono text-xs uppercase mb-1.5">
                Intake Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as WaitlistSource)}
                className="w-full bg-zinc-800 border border-white/10 text-white text-xs font-mono rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="walk_in">Walk-In Host Stand</option>
                <option value="hotel_concierge">Hotel Concierge</option>
                <option value="whatsapp">WhatsApp Direct</option>
                <option value="q_restobar">Q RESTOBAR App</option>
                <option value="website">Online Website</option>
              </select>
            </div>
          </div>

          {/* Hospitality Tags */}
          <div>
            <label className="block text-zinc-400 font-mono text-xs uppercase mb-2">
              Guest Priority & Context Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                const Icon = tag.icon;
                return (
                  <button
                    type="button"
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-amber-400/20 text-amber-300 border border-amber-400/50"
                        : "bg-zinc-800/80 text-zinc-400 border border-white/5 hover:text-zinc-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes & Special Requests */}
          <div>
            <label className="block text-zinc-400 font-mono text-xs uppercase mb-1.5">
              Host Notes & Seating Preferences
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Quiet booth preferred, celebrating 5th anniversary..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-800 border border-white/10 text-white text-xs font-sans rounded-xl p-3 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeAddModal}
              className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-mono text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-400/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "ADDING..." : "ADD TO WAITLIST"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
