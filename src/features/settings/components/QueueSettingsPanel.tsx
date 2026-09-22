import React, { useState } from "react";
import { Save, ListOrdered } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import type { QueueSettings, QueueNotificationChannel } from "../types";

const CHANNEL_OPTIONS: { value: QueueNotificationChannel; label: string; desc: string }[] = [
  { value: "whatsapp", label: "WhatsApp",   desc: "Template message via WhatsApp" },
  { value: "sms",      label: "SMS",        desc: "SMS text notification" },
  { value: "app",      label: "App Notify", desc: "In-app notification (future)" },
];

export function QueueSettingsPanel() {
  const { settings, updateQueue, isSaving } = useSettings();
  const [form, setForm] = useState<QueueSettings | null>(settings?.queue ?? null);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    if (settings) setForm(settings.queue);
  }, [settings]);

  if (!form) return null;

  const set = <K extends keyof QueueSettings>(k: K, v: QueueSettings[K]) =>
    setForm((f) => f ? { ...f, [k]: v } : f);

  const handleSave = async () => {
    if (!form) return;
    await updateQueue(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ListOrdered className="w-5 h-5 text-purple-400" />
        <div>
          <h2 className="text-lg font-black text-white font-mono uppercase">Queue</h2>
          <p className="text-xs text-zinc-500 font-sans">Wait time thresholds and guest notification preferences.</p>
        </div>
      </div>

      {/* Wait Thresholds */}
      <div>
        <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-3">WAIT TIME THRESHOLDS</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([
            { label: "NORMAL", key: "normalWaitThresholdMin" as const, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
            { label: "BUSY",   key: "busyWaitThresholdMin"   as const, color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20" },
            { label: "HIGH",   key: "highWaitThresholdMin"   as const, color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20" },
          ]).map(({ label, key, color, bg }) => (
            <div key={key} className={`p-4 border rounded-lg ${bg}`}>
              <div className={`text-[10px] font-mono font-bold uppercase ${color} mb-2`}>{label} WAIT</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={form[key]}
                  min={5}
                  max={120}
                  onChange={(e) => set(key, Number(e.target.value))}
                  className="w-20 bg-zinc-900 border border-white/15 text-white text-lg font-mono rounded px-3 py-2 focus:outline-none focus:border-purple-500 text-center"
                />
                <span className="text-xs text-zinc-400 font-mono">min</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quote Increment */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">
          Default Quote Increment
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={form.defaultQuoteIncrementMin}
            min={5}
            max={30}
            onChange={(e) => set("defaultQuoteIncrementMin", Number(e.target.value))}
            className="w-20 bg-zinc-800 border border-white/15 text-white text-sm font-mono rounded px-3 py-2.5 focus:outline-none focus:border-purple-500 text-center"
          />
          <span className="text-xs text-zinc-400 font-mono">minutes per quote step</span>
        </div>
      </div>

      {/* Notification Channel */}
      <div>
        <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-3">
          PREFERRED NOTIFICATION CHANNEL
          <span className="ml-2 text-zinc-600">(no real sends in DEV PREVIEW)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CHANNEL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set("preferredNotificationChannel", opt.value)}
              className={`text-left p-3 rounded-lg border transition-all ${
                form.preferredNotificationChannel === opt.value
                  ? "bg-purple-600/20 border-purple-500/50 text-white"
                  : "bg-zinc-800 border-white/10 text-zinc-400 hover:border-white/20"
              }`}
            >
              <div className="text-xs font-mono font-bold uppercase">{opt.label}</div>
              <div className="text-[10px] text-zinc-500 font-sans mt-0.5">{opt.desc}</div>
            </button>
          ))}
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
