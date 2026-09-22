import React, { useState } from "react";
import { Save, Hotel, ToggleLeft, ToggleRight, AlertTriangle } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import type { HotelSettings } from "../types";

function Toggle({ enabled, onToggle, label, desc }: {
  enabled: boolean; onToggle: () => void; label: string; desc: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-white/5 last:border-0">
      <div>
        <div className="text-xs font-mono text-zinc-300 font-semibold">{label}</div>
        <div className="text-[10px] text-zinc-500 font-sans mt-0.5">{desc}</div>
      </div>
      <button onClick={onToggle} className="flex-shrink-0 mt-0.5">
        {enabled
          ? <ToggleRight className="w-7 h-7 text-blue-400" />
          : <ToggleLeft className="w-7 h-7 text-zinc-600" />
        }
      </button>
    </div>
  );
}

export function HotelModePanel() {
  const { settings, updateHotel, isSaving } = useSettings();
  const [form, setForm] = useState<HotelSettings | null>(settings?.hotel ?? null);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    if (settings) setForm(settings.hotel);
  }, [settings]);

  if (!form) return null;

  const set = <K extends keyof HotelSettings>(k: K, v: HotelSettings[K]) =>
    setForm((f) => f ? { ...f, [k]: v } : f);

  const handleSave = async () => {
    if (!form) return;
    await updateHotel(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Hotel className="w-5 h-5 text-blue-400" />
        <div>
          <h2 className="text-lg font-black text-white font-mono uppercase">Hotel Mode</h2>
          <p className="text-xs text-zinc-500 font-sans">
            Enable hotel guest context for reservation, queue and concierge workflows.
          </p>
        </div>
      </div>

      {/* Master Toggle */}
      <div className={`p-5 rounded-xl border-2 transition-all duration-300 ${
        form.hotelModeEnabled
          ? "bg-blue-500/10 border-blue-500/40"
          : "bg-zinc-900 border-white/10"
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-black text-white font-mono uppercase tracking-wide">
              HOTEL MODE
            </div>
            <div className="text-xs text-zinc-400 font-sans mt-1">
              {form.hotelModeEnabled
                ? "Hotel guest context is active across all modules."
                : "Disabled — Q F&B operates as a standard restaurant system."}
            </div>
          </div>
          <button
            onClick={() => set("hotelModeEnabled", !form.hotelModeEnabled)}
            className="flex-shrink-0"
          >
            {form.hotelModeEnabled
              ? <ToggleRight className="w-10 h-10 text-blue-400 drop-shadow-lg" />
              : <ToggleLeft className="w-10 h-10 text-zinc-600" />
            }
          </button>
        </div>
      </div>

      {/* Hotel Details — shown when enabled */}
      {form.hotelModeEnabled && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Hotel Name</label>
              <input
                type="text"
                value={form.hotelName}
                onChange={(e) => set("hotelName", e.target.value)}
                placeholder="Grand Quantum Hotel"
                className="w-full bg-zinc-800 border border-white/15 text-white text-sm rounded px-3 py-2.5 focus:outline-none focus:border-blue-500 placeholder:text-zinc-600 font-sans"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Property Code</label>
              <input
                type="text"
                value={form.propertyCode}
                onChange={(e) => set("propertyCode", e.target.value)}
                placeholder="GQH-KL-001"
                className="w-full bg-zinc-800 border border-white/15 text-white text-sm rounded px-3 py-2.5 focus:outline-none focus:border-blue-500 placeholder:text-zinc-600 font-mono"
              />
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="p-4 bg-zinc-900 border border-white/8 rounded-lg">
            <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-3">HOTEL FEATURES</div>
            <div className="space-y-0">
              <Toggle
                enabled={form.showRoomNumber}
                onToggle={() => set("showRoomNumber", !form.showRoomNumber)}
                label="Show Room Number"
                desc="Display room number on reservations, queue entries, and guest profiles"
              />
              <Toggle
                enabled={form.enableConciergeBookings}
                onToggle={() => set("enableConciergeBookings", !form.enableConciergeBookings)}
                label="Concierge Bookings"
                desc="Allow concierge staff to create reservations with hotel source context"
              />
              <Toggle
                enabled={form.enableHotelGuestTags}
                onToggle={() => set("enableHotelGuestTags", !form.enableHotelGuestTags)}
                label="Hotel Guest Tags"
                desc="Show HOTEL GUEST and VIP tier tags on guest profiles and arrivals"
              />
              <Toggle
                enabled={form.enableFutureChargeToRoom}
                onToggle={() => set("enableFutureChargeToRoom", !form.enableFutureChargeToRoom)}
                label="Charge-to-Room Eligibility (Future)"
                desc="Mark eligible reservations as charge-to-room candidates — no actual billing"
              />
            </div>
          </div>

          {/* Architecture boundaries */}
          <div className="p-4 bg-amber-500/8 border border-amber-500/20 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="text-[10px] text-amber-300 font-mono font-bold uppercase">Operational Architecture Boundary</div>
            </div>
            <ul className="text-[10px] text-zinc-400 font-sans space-y-1 leading-relaxed ml-6 list-disc">
              <li>Hotel context is informational only — no PMS connection built</li>
              <li>Queue fairness is NOT affected by hotel/VIP status (waitlist fairness preserved)</li>
              <li>Charge-to-room is an eligibility flag only — no folio posting or billing</li>
              <li>No real PMS API calls (Opera, Mews, Cloudbeds) — operational system isolation preserved</li>
            </ul>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-mono font-bold uppercase rounded transition-all ${
            saved ? "bg-emerald-600 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"
          } disabled:opacity-50`}
        >
          <Save className="w-3.5 h-3.5" />
          {saved ? "SAVED!" : isSaving ? "SAVING..." : "SAVE CHANGES"}
        </button>
      </div>
    </div>
  );
}
