import React, { useState } from "react";
import { Save, Grid } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import type { FloorSettings } from "../types";

function NumericField({ label, unit, hint, value, onChange, min = 0, max = 999 }: {
  label: string; unit: string; hint?: string; value: number;
  onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <div className="p-4 bg-zinc-900/60 border border-white/8 rounded-lg space-y-2">
      <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">{label}</div>
      <div className="flex items-center gap-3">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-20 bg-zinc-800 border border-white/15 text-white text-lg font-mono rounded px-3 py-2 focus:outline-none focus:border-purple-500 text-center"
        />
        <span className="text-sm text-zinc-400 font-mono">{unit}</span>
      </div>
      {hint && <div className="text-[10px] text-zinc-600 font-sans leading-relaxed">{hint}</div>}
    </div>
  );
}

export function FloorSettingsPanel() {
  const { settings, updateFloor, isSaving } = useSettings();
  const [form, setForm] = useState<FloorSettings | null>(settings?.floor ?? null);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    if (settings) setForm(settings.floor);
  }, [settings]);

  if (!form) return null;

  const set = <K extends keyof FloorSettings>(k: K, v: FloorSettings[K]) =>
    setForm((f) => f ? { ...f, [k]: v } : f);

  const handleSave = async () => {
    if (!form) return;
    await updateFloor(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Grid className="w-5 h-5 text-purple-400" />
        <div>
          <h2 className="text-lg font-black text-white font-mono uppercase">Floor</h2>
          <p className="text-xs text-zinc-500 font-sans">Table turn duration, cleaning buffers, and availability windows.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NumericField
          label="Cleaning Buffer"
          unit="minutes"
          hint="Time reserved between table turns for cleaning and reset."
          value={form.defaultCleaningBufferMin}
          onChange={(v) => set("defaultCleaningBufferMin", v)}
          min={5} max={60}
        />
        <NumericField
          label="Table Turn Duration"
          unit="minutes"
          hint="Expected standard dining time used for availability projection."
          value={form.defaultTableTurnDurationMin}
          onChange={(v) => set("defaultTableTurnDurationMin", v)}
          min={30} max={300}
        />
        <NumericField
          label="Min Availability Window"
          unit="minutes"
          hint="Minimum gap required for Smart Availability to offer a slot."
          value={form.smartAvailabilityMinWindowMin}
          onChange={(v) => set("smartAvailabilityMinWindowMin", v)}
          min={15} max={180}
        />
      </div>

      <div className="p-3 bg-zinc-800/50 border border-white/5 rounded text-[10px] text-zinc-500 font-mono">
        These values feed directly into the Smart Availability engine. Cleaning buffer is added after each booking's expected end time.
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
