import React, { useState, useEffect } from "react";
import { 
  X, 
  Edit3, 
  AlertTriangle, 
  Crown, 
  ShieldAlert
} from "lucide-react";
import { useGuests } from "../context/GuestContext";

const ALLERGY_PRESETS = ["SHELLFISH", "PEANUTS", "TREE_NUTS", "DAIRY", "EGG", "GLUTEN", "SOY"];
const DIETARY_PRESETS = ["VEGETARIAN", "VEGAN", "HALAL", "NO_PORK", "PESCATARIAN", "LOW_SODIUM"];

export function EditGuestModal() {
  const {
    selectedGuest,
    isEditModalOpen,
    closeEditModal,
    updateGuest,
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

  const [marketingEmail, setMarketingEmail] = useState<boolean>(false);
  const [marketingWhatsapp, setMarketingWhatsapp] = useState<boolean>(false);
  const [marketingSms, setMarketingSms] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (selectedGuest) {
      setFirstName(selectedGuest.first_name);
      setLastName(selectedGuest.last_name);
      setDisplayName(selectedGuest.display_name || "");
      setPhone(selectedGuest.phone || "");
      setWhatsapp(selectedGuest.whatsapp || "");
      setEmail(selectedGuest.email || "");
      setDob(selectedGuest.date_of_birth || "");
      setAnniversary(selectedGuest.anniversary_date || "");
      setPreferredArea(selectedGuest.preferred_seating_area_id || "");
      setSelectedAllergies(selectedGuest.allergies || []);
      setSelectedDietary(selectedGuest.dietary_requirements || []);
      setHospitalityNotes(selectedGuest.hospitality_notes || "");
      setIsVip(selectedGuest.is_vip);
      setMarketingEmail(selectedGuest.marketing_email_opt_in);
      setMarketingWhatsapp(selectedGuest.marketing_whatsapp_opt_in);
      setMarketingSms(selectedGuest.marketing_sms_opt_in);
    }
  }, [selectedGuest]);

  if (!isEditModalOpen || !selectedGuest) return null;

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

      await updateGuest(selectedGuest.id, {
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
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update guest profile");
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
            <Edit3 className="w-5 h-5 text-purple-400" />
            <h2 className="font-mono text-base font-black text-white uppercase tracking-wider">
              Edit Guest Profile
            </h2>
          </div>
          <button
            onClick={closeEditModal}
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

          {/* Name Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 font-mono text-xs uppercase mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
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
                Privacy & Communication Consent:
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
              onClick={closeEditModal}
              className="px-4 py-2 rounded-xl font-mono text-xs font-bold text-zinc-400 hover:text-white cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-mono text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-500/20 transition-all disabled:opacity-40 cursor-pointer"
            >
              {isSubmitting ? "SAVING..." : "UPDATE PROFILE"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
