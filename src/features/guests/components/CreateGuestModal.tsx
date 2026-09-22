import React, { useState, useEffect } from "react";
import { 
  X, 
  UserPlus, 
  AlertTriangle, 
  Crown, 
  Phone, 
  Mail, 
  ShieldAlert, 
  Check, 
  ExternalLink,
  Users
} from "lucide-react";
import { useGuests } from "../context/GuestContext";
import { DuplicateMatchResult } from "../types";

const ALLERGY_PRESETS = ["SHELLFISH", "PEANUTS", "TREE_NUTS", "DAIRY", "EGG", "GLUTEN", "SOY"];
const DIETARY_PRESETS = ["VEGETARIAN", "VEGAN", "HALAL", "NO_PORK", "PESCATARIAN", "LOW_SODIUM"];

export function CreateGuestModal() {
  const {
    isCreateModalOpen,
    closeCreateModal,
    createGuest,
    checkDuplicate,
    openGuestDetail,
  } = useGuests();

  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [whatsapp, setWhatsapp] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [dob, setDob] = useState<string>("");
  const [anniversary, setAnniversary] = useState<string>("");
  const [preferredArea, setPreferredArea] = useState<string>("");
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [hospitalityNotes, setHospitalityNotes] = useState<string>("");
  const [isVip, setIsVip] = useState<boolean>(false);

  // Marketing Opt-ins strictly default to FALSE
  const [marketingEmail, setMarketingEmail] = useState<boolean>(false);
  const [marketingWhatsapp, setMarketingWhatsapp] = useState<boolean>(false);
  const [marketingSms, setMarketingSms] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Duplicate matching state
  const [duplicateMatch, setDuplicateMatch] = useState<DuplicateMatchResult | null>(null);
  const [ignoredDuplicate, setIgnoredDuplicate] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const runCheck = async () => {
      if ((phone.trim().length >= 6 || email.trim().length >= 5 || whatsapp.trim().length >= 6) && !ignoredDuplicate) {
        const result = await checkDuplicate(phone, email, whatsapp);
        if (isMounted) {
          setDuplicateMatch(result.hasMatch ? result : null);
        }
      } else if (isMounted) {
        setDuplicateMatch(null);
      }
    };

    const timer = setTimeout(runCheck, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [phone, email, whatsapp, checkDuplicate, ignoredDuplicate]);

  if (!isCreateModalOpen) return null;

  const toggleAllergy = (allergy: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy]
    );
  };

  const toggleDietary = (dietary: string) => {
    setSelectedDietary((prev) =>
      prev.includes(dietary) ? prev.filter((d) => d !== dietary) : [...prev, dietary]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg("First name and last name are required");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      await createGuest({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        display_name: displayName.trim() || undefined,
        phone: phone.trim() || undefined,
        whatsapp: whatsapp.trim() || phone.trim() || undefined,
        email: email.trim() || undefined,
        date_of_birth: dob || undefined,
        anniversary_date: anniversary || undefined,
        preferred_seating_area_id: preferredArea || undefined,
        allergies: selectedAllergies,
        dietary_requirements: selectedDietary,
        hospitality_notes: hospitalityNotes.trim() || undefined,
        is_vip: isVip,
        marketing_email_opt_in: marketingEmail,
        marketing_whatsapp_opt_in: marketingWhatsapp,
        marketing_sms_opt_in: marketingSms,
      });

      // Reset form
      setFirstName("");
      setLastName("");
      setDisplayName("");
      setPhone("");
      setWhatsapp("");
      setEmail("");
      setDob("");
      setAnniversary("");
      setPreferredArea("");
      setSelectedAllergies([]);
      setSelectedDietary([]);
      setHospitalityNotes("");
      setIsVip(false);
      setMarketingEmail(false);
      setMarketingWhatsapp(false);
      setMarketingSms(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create guest");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8 flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-purple-400" />
            <h2 className="font-mono text-base font-black text-white uppercase tracking-wider">
              New Guest Profile
            </h2>
          </div>
          <button
            onClick={closeCreateModal}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Duplicate Match Warning Banner */}
          {duplicateMatch?.hasMatch && duplicateMatch.matchedGuest && !ignoredDuplicate && (
            <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="text-amber-300 font-mono text-xs font-black uppercase flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  POSSIBLE EXISTING GUEST FOUND
                </div>
                <span className="text-[10px] font-mono text-zinc-400">
                  Exact Match ({duplicateMatch.matchType})
                </span>
              </div>

              <div className="bg-zinc-950/80 p-3 rounded-lg text-xs font-mono border border-white/5 space-y-1">
                <div className="font-bold text-white flex items-center gap-2">
                  <span>{duplicateMatch.matchedGuest.display_name || `${duplicateMatch.matchedGuest.first_name} ${duplicateMatch.matchedGuest.last_name}`}</span>
                  {duplicateMatch.matchedGuest.is_vip && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[9px] font-black">
                      VIP
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-zinc-400 flex items-center gap-3">
                  <span>Phone: {duplicateMatch.matchedGuest.phone || "N/A"}</span>
                  <span>•</span>
                  <span>{duplicateMatch.matchedGuest.visit_count} visits recorded</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIgnoredDuplicate(true)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-mono text-zinc-400 hover:text-white"
                >
                  Create New Anyway
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeCreateModal();
                    openGuestDetail(duplicateMatch.matchedGuest!);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 text-zinc-950 font-mono text-xs font-black uppercase tracking-wider hover:bg-amber-300 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Existing Profile
                </button>
              </div>
            </div>
          )}

          {/* Name Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 font-mono text-xs uppercase mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Marcus"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-zinc-800 border border-white/10 text-white text-xs font-sans rounded-xl p-2.5 focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-mono text-xs uppercase mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Vance"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-zinc-800 border border-white/10 text-white text-xs font-sans rounded-xl p-2.5 focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          {/* Contact Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 font-mono text-xs uppercase mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+60 12-345 6789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-zinc-800 border border-white/10 text-white text-xs font-sans rounded-xl p-2.5 focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-mono text-xs uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="marcus@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-800 border border-white/10 text-white text-xs font-sans rounded-xl p-2.5 focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          {/* Dates & Preferred Seating */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-400 font-mono text-[11px] uppercase mb-1">
                Birthday
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-zinc-800 border border-white/10 text-white text-xs font-mono rounded-xl p-2 focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-mono text-[11px] uppercase mb-1">
                Anniversary
              </label>
              <input
                type="date"
                value={anniversary}
                onChange={(e) => setAnniversary(e.target.value)}
                className="w-full bg-zinc-800 border border-white/10 text-white text-xs font-mono rounded-xl p-2 focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-mono text-[11px] uppercase mb-1">
                Preferred Area
              </label>
              <select
                value={preferredArea}
                onChange={(e) => setPreferredArea(e.target.value)}
                className="w-full bg-zinc-800 border border-white/10 text-white text-xs font-mono rounded-xl p-2 focus:outline-none focus:border-purple-400"
              >
                <option value="">No Preference</option>
                <option value="area-main">Main Dining</option>
                <option value="area-terrace">Alfresco Terrace</option>
                <option value="area-bar">Cocktail Bar</option>
                <option value="area-pdr">Private Dining Suite</option>
              </select>
            </div>
          </div>

          {/* Allergies Preset Buttons */}
          <div>
            <label className="block text-rose-400 font-mono text-xs uppercase mb-1.5 flex items-center gap-1 font-bold">
              <ShieldAlert className="w-3.5 h-3.5" />
              Allergies (Critical Safety Flags)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALLERGY_PRESETS.map((allergy) => {
                const isSelected = selectedAllergies.includes(allergy);
                return (
                  <button
                    key={allergy}
                    type="button"
                    onClick={() => toggleAllergy(allergy)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-rose-500 text-white shadow-xs"
                        : "bg-zinc-800 text-zinc-400 hover:text-white border border-white/5"
                    }`}
                  >
                    {allergy}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dietary Requirements */}
          <div>
            <label className="block text-zinc-400 font-mono text-xs uppercase mb-1.5">
              Dietary Preferences
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DIETARY_PRESETS.map((dietary) => {
                const isSelected = selectedDietary.includes(dietary);
                return (
                  <button
                    key={dietary}
                    type="button"
                    onClick={() => toggleDietary(dietary)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-emerald-500 text-zinc-950 font-black"
                        : "bg-zinc-800 text-zinc-400 hover:text-white border border-white/5"
                    }`}
                  >
                    {dietary.replace(/_/g, " ")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hospitality Notes */}
          <div>
            <label className="block text-zinc-400 font-mono text-xs uppercase mb-1">
              Hospitality Notes & Special Preferences
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Prefers sparkling water, loves window seating..."
              value={hospitalityNotes}
              onChange={(e) => setHospitalityNotes(e.target.value)}
              className="w-full bg-zinc-800 border border-white/10 text-white text-xs font-sans rounded-xl p-2.5 focus:outline-none focus:border-purple-400"
            />
          </div>

          {/* VIP & Marketing Opt-Ins */}
          <div className="bg-zinc-950 p-3.5 rounded-xl border border-white/5 space-y-3 text-xs font-mono">
            <label className="flex items-center gap-2 text-amber-300 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={isVip}
                onChange={(e) => setIsVip(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-zinc-800 accent-amber-400"
              />
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Mark as VIP Guest</span>
            </label>

            <div className="pt-2 border-t border-white/5 space-y-1.5 text-zinc-400 text-[11px]">
              <div className="text-zinc-500 uppercase text-[10px] font-bold">
                Privacy & Communication Consent (Default: OFF):
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketingEmail}
                    onChange={(e) => setMarketingEmail(e.target.checked)}
                    className="accent-purple-400"
                  />
                  <span>Email</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketingWhatsapp}
                    onChange={(e) => setMarketingWhatsapp(e.target.checked)}
                    className="accent-purple-400"
                  />
                  <span>WhatsApp</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketingSms}
                    onChange={(e) => setMarketingSms(e.target.checked)}
                    className="accent-purple-400"
                  />
                  <span>SMS</span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeCreateModal}
              className="px-4 py-2 rounded-xl font-mono text-xs font-bold text-zinc-400 hover:text-white"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-mono text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-500/20 transition-all disabled:opacity-40 cursor-pointer"
            >
              {isSubmitting ? "SAVING..." : "CREATE GUEST PROFILE"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
