import React, { useState } from "react";
import { Save, Users } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import type { GuestSettings } from "../types";

export function GuestSettingsPanel() {
  const { settings, updateGuests, isSaving } = useSettings();
  const [form, setForm] = useState<GuestSettings | null>(settings?.guests ?? null);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    if (settings) setForm(settings.guests);
  }, [settings]);

  if (!form) return null;

  const set = <K extends keyof GuestSettings>(k: K, v: GuestSettings[K]) =>
    setForm((f) => f ? { ...f, [k]: v } : f);

  const handleSave = async () => {
    if (!form) return;
    await updateGuests(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-5 h-5 text-purple-400" />
        <div>
          <h2 className="text-lg font-black text-white font-mono uppercase">Guests</h2>
          <p className="text-xs text-zinc-500 font-sans">
            Visit count thresholds for guest classification.
          </p>
        </div>
      </div>

      <div className="p-4 bg-zinc-800/50 border border-white/8 rounded-lg text-xs text-zinc-400 font-sans leading-relaxed">
        <strong className="text-zinc-300 font-mono">Transparent Thresholds</strong><br />
        These are operational visit-count thresholds only. Guest classifications are visible to staff to support hospitality decisions. They are not spend-based, do not affect VIP tagging (which is manual), and marketing communication defaults remain OFF.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-zinc-900/60 border border-teal-500/20 rounded-lg space-y-3">
          <div className="text-[10px] text-teal-400 font-mono font-bold uppercase">RETURNING GUEST</div>
          <div className="text-[10px] text-zinc-500 font-sans">
            Guests with this many or more visits are shown as "returning".
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={form.returningGuestVisitCount}
              min={2}
              max={20}
              onChange={(e) => set("returningGuestVisitCount", Number(e.target.value))}
              className="w-20 bg-zinc-800 border border-white/15 text-white text-lg font-mono rounded px-3 py-2 focus:outline-none focus:border-teal-500 text-center"
            />
            <span className="text-xs text-zinc-400 font-mono">visits minimum</span>
          </div>
        </div>

        <div className="p-4 bg-zinc-900/60 border border-purple-500/20 rounded-lg space-y-3">
          <div className="text-[10px] text-purple-400 font-mono font-bold uppercase">REGULAR GUEST</div>
          <div className="text-[10px] text-zinc-500 font-sans">
            Guests with this many or more visits are shown as "regular".
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={form.regularGuestVisitCount}
              min={form.returningGuestVisitCount + 1}
              max={50}
              onChange={(e) => set("regularGuestVisitCount", Number(e.target.value))}
              className="w-20 bg-zinc-800 border border-white/15 text-white text-lg font-mono rounded px-3 py-2 focus:outline-none focus:border-purple-500 text-center"
            />
            <span className="text-xs text-zinc-400 font-mono">visits minimum</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-mono font-bold uppercase rounded transition-all ${
            saved ? "bg-emerald-600 text-white" : "bg-purple-600 hover:bg-purple-500 text-white"
          } disabled:opacity-50`}
        >
          <Save className="w-3.5 h-3.5" />
          {saved ? "SAVED!" : isSaving ? "SAVING..." : "SAVE CHANGES"}
        </button>
      </div>
    </div>
  );
}
