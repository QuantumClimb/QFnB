import React, { useState } from "react";
import { Save, Clock, ToggleLeft, ToggleRight } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import type { ServiceSettings, ServicePeriodConfig } from "../types";

export function ServiceSettingsPanel() {
  const { settings, updateService, isSaving } = useSettings();
  const [periods, setPeriods] = useState<ServicePeriodConfig[]>(
    settings?.service.periods ?? []
  );
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    if (settings) setPeriods(settings.service.periods);
  }, [settings]);

  const updatePeriod = <K extends keyof ServicePeriodConfig>(
    idx: number, key: K, value: ServicePeriodConfig[K]
  ) => {
    setPeriods((prev) => prev.map((p, i) => i === idx ? { ...p, [key]: value } : p));
  };

  const handleSave = async () => {
    await updateService({ periods });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const PERIOD_ACCENT: Record<string, string> = {
    BREAKFAST: "text-amber-400",
    LUNCH: "text-orange-400",
    DINNER: "text-purple-400",
    LATE_NIGHT: "text-indigo-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Clock className="w-5 h-5 text-purple-400" />
        <div>
          <h2 className="text-lg font-black text-white font-mono uppercase">Service Periods</h2>
          <p className="text-xs text-zinc-500 font-sans">Configure active service windows for this outlet.</p>
        </div>
      </div>

      <div className="space-y-3">
        {periods.map((period, idx) => (
          <div
            key={period.id}
            className={`p-4 bg-zinc-900 border rounded-lg transition-colors ${
              period.isActive ? "border-purple-500/30" : "border-white/8 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-mono font-bold uppercase ${PERIOD_ACCENT[period.id] ?? "text-zinc-400"}`}>
                  {period.name}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  period.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-700 text-zinc-500"
                }`}>
                  {period.isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
              <button
                onClick={() => updatePeriod(idx, "isActive", !period.isActive)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                {period.isActive
                  ? <ToggleRight className="w-6 h-6 text-emerald-400" />
                  : <ToggleLeft className="w-6 h-6 text-zinc-600" />
                }
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-600 font-mono uppercase">Start Time</label>
                <input
                  type="time"
                  value={period.startTime}
                  onChange={(e) => updatePeriod(idx, "startTime", e.target.value)}
                  className="w-full bg-zinc-800 border border-white/15 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-600 font-mono uppercase">End Time</label>
                <input
                  type="time"
                  value={period.endTime}
                  onChange={(e) => updatePeriod(idx, "endTime", e.target.value)}
                  className="w-full bg-zinc-800 border border-white/15 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>
          </div>
        ))}
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
