import React, { useState } from "react";
import { Save, Store } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import type { RestaurantSettings } from "../types";

const TIMEZONES = [
  "Asia/Kuala_Lumpur", "Asia/Singapore", "Asia/Bangkok", "Asia/Jakarta",
  "Asia/Manila", "Asia/Tokyo", "Asia/Hong_Kong", "Asia/Dubai",
  "Europe/London", "America/New_York", "America/Los_Angeles",
];

const CURRENCIES = ["MYR", "SGD", "THB", "IDR", "PHP", "USD", "EUR", "GBP", "AED"];

const LOCALES = ["en-MY", "en-SG", "en-US", "en-GB", "ms-MY", "zh-CN", "zh-TW"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-zinc-800 border border-white/15 text-white text-sm rounded px-3 py-2.5 focus:outline-none focus:border-purple-500 placeholder:text-zinc-600 font-sans transition-colors"
    />
  );
}

function SelectInput({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-zinc-800 border border-white/15 text-white text-sm rounded px-3 py-2.5 focus:outline-none focus:border-purple-500 font-sans"
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export function RestaurantSettingsPanel() {
  const { settings, updateRestaurant, isSaving } = useSettings();
  const [form, setForm] = useState<RestaurantSettings | null>(settings?.restaurant ?? null);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    if (settings) setForm(settings.restaurant);
  }, [settings]);

  if (!form) return null;

  const set = <K extends keyof RestaurantSettings>(k: K, v: RestaurantSettings[K]) =>
    setForm((f) => f ? { ...f, [k]: v } : f);

  const handleSave = async () => {
    if (!form) return;
    await updateRestaurant(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Store className="w-5 h-5 text-purple-400" />
        <div>
          <h2 className="text-lg font-black text-white font-mono uppercase">Restaurant</h2>
          <p className="text-xs text-zinc-500 font-sans">Outlet identity, contact information and locale settings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Display Name">
          <TextInput value={form.displayName} onChange={(v) => set("displayName", v)} placeholder="Quantum Climb" />
        </Field>
        <Field label="Email">
          <TextInput value={form.email} onChange={(v) => set("email", v)} placeholder="reservations@venue.com" type="email" />
        </Field>
        <Field label="Phone">
          <TextInput value={form.phone} onChange={(v) => set("phone", v)} placeholder="+60 11 6424 2145" />
        </Field>
        <Field label="WhatsApp">
          <TextInput value={form.whatsapp} onChange={(v) => set("whatsapp", v)} placeholder="+60 12-xxx xxxx" />
        </Field>
        <Field label="Address">
          <TextInput value={form.addressLine1} onChange={(v) => set("addressLine1", v)} placeholder="Street address" />
        </Field>
        <Field label="City">
          <TextInput value={form.city} onChange={(v) => set("city", v)} placeholder="Kuala Lumpur" />
        </Field>
        <Field label="Country">
          <TextInput value={form.country} onChange={(v) => set("country", v)} placeholder="Malaysia" />
        </Field>
      </div>

      <div className="pt-4 border-t border-white/8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Timezone">
          <SelectInput value={form.timezone} onChange={(v) => set("timezone", v)} options={TIMEZONES} />
        </Field>
        <Field label="Currency">
          <SelectInput value={form.currency} onChange={(v) => set("currency", v)} options={CURRENCIES} />
        </Field>
        <Field label="Locale">
          <SelectInput value={form.locale} onChange={(v) => set("locale", v)} options={LOCALES} />
        </Field>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-mono font-bold uppercase rounded transition-all ${
            saved
              ? "bg-emerald-600 text-white"
              : "bg-purple-600 hover:bg-purple-500 text-white"
          } disabled:opacity-50`}
        >
          <Save className="w-3.5 h-3.5" />
          {saved ? "SAVED!" : isSaving ? "SAVING..." : "SAVE CHANGES"}
        </button>
      </div>
    </div>
  );
}
