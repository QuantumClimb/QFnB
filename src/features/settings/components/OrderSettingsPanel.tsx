import React, { useState } from "react";
import { Save, UtensilsCrossed, ToggleLeft, ToggleRight } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import type { OrderSettings, StationConfig } from "../types";

const STATIONS: { key: keyof StationConfig; label: string; color: string }[] = [
  { key: "kitchen", label: "Kitchen", color: "text-orange-400" },
  { key: "bar",     label: "Bar",     color: "text-amber-400" },
  { key: "dessert", label: "Dessert", color: "text-pink-400" },
  { key: "service", label: "Service", color: "text-teal-400" },
];

export function OrderSettingsPanel() {
  const { settings, updateOrders, isSaving } = useSettings();
  const [form, setForm] = useState<OrderSettings | null>(settings?.orders ?? null);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    if (settings) setForm(settings.orders);
  }, [settings]);

  if (!form) return null;

  const set = <K extends keyof OrderSettings>(k: K, v: OrderSettings[K]) =>
    setForm((f) => f ? { ...f, [k]: v } : f);

  const toggleStation = (key: keyof StationConfig) => {
    setForm((f) => f ? {
      ...f,
      stationEnabled: { ...f.stationEnabled, [key]: !f.stationEnabled[key] }
    } : f);
  };

  const handleSave = async () => {
    if (!form) return;
    await updateOrders(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <UtensilsCrossed className="w-5 h-5 text-purple-400" />
        <div>
          <h2 className="text-lg font-black text-white font-mono uppercase">Orders</h2>
          <p className="text-xs text-zinc-500 font-sans">Prep time thresholds and station configuration.</p>
        </div>
      </div>

      {/* Prep Thresholds */}
      <div>
        <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-3">PREP TIME THRESHOLDS</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {([
            { label: "ATTENTION THRESHOLD", key: "prepAttentionThresholdMin" as const, color: "text-amber-400", desc: "Flag items approaching this prep time" },
            { label: "DELAYED THRESHOLD",   key: "prepDelayedThresholdMin"   as const, color: "text-red-400",   desc: "Flag items overdue at this prep time" },
          ]).map(({ label, key, color, desc }) => (
            <div key={key} className="p-4 bg-zinc-900/60 border border-white/8 rounded-lg space-y-2">
              <div className={`text-[10px] font-mono font-bold uppercase ${color}`}>{label}</div>
              <div className="text-[10px] text-zinc-600 font-sans">{desc}</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={form[key]}
                  min={5}
                  max={120}
                  onChange={(e) => set(key, Number(e.target.value))}
                  className="w-20 bg-zinc-800 border border-white/15 text-white text-lg font-mono rounded px-3 py-2 focus:outline-none focus:border-purple-500 text-center"
                />
                <span className="text-xs text-zinc-400 font-mono">minutes</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Station Enablement */}
      <div>
        <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-3">ACTIVE STATIONS</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATIONS.map(({ key, label, color }) => {
            const enabled = form.stationEnabled[key];
            return (
              <button
                key={key}
                onClick={() => toggleStation(key)}
                className={`flex flex-col items-center p-4 rounded-lg border transition-all ${
                  enabled
                    ? "bg-zinc-800 border-white/20 text-white"
                    : "bg-zinc-900/40 border-white/5 text-zinc-600"
                }`}
              >
                {enabled
                  ? <ToggleRight className={`w-6 h-6 ${color}`} />
                  : <ToggleLeft className="w-6 h-6 text-zinc-600" />
                }
                <div className={`text-xs font-mono font-bold uppercase mt-2 ${enabled ? color : "text-zinc-600"}`}>
                  {label}
                </div>
                <div className="text-[9px] font-mono mt-0.5 text-zinc-600">
                  {enabled ? "ENABLED" : "DISABLED"}
                </div>
              </button>
            );
          })}
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
