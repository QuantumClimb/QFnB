import React, { useState } from "react";
import { Save, CalendarCheck } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import type { ReservationSettings } from "../types";

function NumericField({ label, unit, value, onChange, min = 0, max = 999 }: {
  label: string; unit: string; value: number;
  onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 bg-zinc-800 border border-white/15 text-white text-sm rounded px-3 py-2.5 focus:outline-none focus:border-purple-500 font-mono text-center"
        />
        <span className="text-xs text-zinc-500 font-mono">{unit}</span>
      </div>
    </div>
  );
}

export function ReservationSettingsPanel() {
  const { settings, updateReservations, isSaving } = useSettings();
  const [form, setForm] = useState<ReservationSettings | null>(settings?.reservations ?? null);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    if (settings) setForm(settings.reservations);
  }, [settings]);

  if (!form) return null;

  const set = <K extends keyof ReservationSettings>(k: K, v: ReservationSettings[K]) =>
    setForm((f) => f ? { ...f, [k]: v } : f);

  const handleSave = async () => {
    if (!form) return;
    await updateReservations(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CalendarCheck className="w-5 h-5 text-purple-400" />
        <div>
          <h2 className="text-lg font-black text-white font-mono uppercase">Reservations</h2>
          <p className="text-xs text-zinc-500 font-sans">Booking rules, durations, and thresholds.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <NumericField
          label="Default Dining Duration"
          unit="minutes"
          value={form.defaultDiningDurationMin}
          onChange={(v) => set("defaultDiningDurationMin", v)}
          min={30} max={360}
        />
        <NumericField
          label="Reservation Interval"
          unit="minutes"
          value={form.reservationIntervalMin}
          onChange={(v) => set("reservationIntervalMin", v)}
          min={5} max={60}
        />
        <NumericField
          label="Late Arrival Threshold"
          unit="minutes"
          value={form.lateArrivalThresholdMin}
          onChange={(v) => set("lateArrivalThresholdMin", v)}
          min={5} max={60}
        />
        <NumericField
          label="No-Show Threshold"
          unit="minutes"
          value={form.noShowThresholdMin}
          onChange={(v) => set("noShowThresholdMin", v)}
          min={10} max={120}
        />
        <NumericField
          label="Max Online Party Size"
          unit="guests"
          value={form.maxOnlinePartySize}
          onChange={(v) => set("maxOnlinePartySize", v)}
          min={1} max={50}
        />
      </div>

      <div className="p-3 bg-zinc-800/50 border border-white/5 rounded text-[10px] text-zinc-500 font-mono">
        Reservation interval controls the booking time grid slot spacing. Late arrival and no-show thresholds trigger operational alerts in the Today and Manager views.
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
