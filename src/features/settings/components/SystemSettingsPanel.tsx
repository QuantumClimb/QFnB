import React from "react";
import { Settings, Info } from "lucide-react";
import { useOrg } from "../../../context/OrgContext";
import { useAuth } from "../../../context/AuthContext";

export function SystemSettingsPanel() {
  const { currentOrg, currentOutlet, outlets, role } = useOrg();
  const { isDevPreview } = useAuth();

  const items: { label: string; value: string }[] = [
    { label: "APPLICATION",      value: "Q F&B OS" },
    { label: "TAGLINE",          value: "The live operating system for hospitality." },
    { label: "BUILD MODE",       value: isDevPreview ? "DEV PREVIEW" : "TENANT SESSION" },
    { label: "ORGANIZATION",     value: currentOrg?.name ?? "—" },
    { label: "ORG SLUG",         value: currentOrg?.slug ?? "—" },
    { label: "ACTIVE OUTLET",    value: currentOutlet?.name ?? "—" },
    { label: "OUTLET COUNT",     value: String(outlets.length) },
    { label: "CURRENT ROLE",     value: role.toUpperCase() },
    { label: "TIMEZONE",         value: currentOutlet?.timezone ?? "—" },
    { label: "FRAMEWORK",        value: "Vite + React + TypeScript" },
    { label: "DATABASE",         value: "Supabase (PostgreSQL + RLS)" },
    { label: "VERSION",          value: "0.9.0" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-5 h-5 text-purple-400" />
        <div>
          <h2 className="text-lg font-black text-white font-mono uppercase">System</h2>
          <p className="text-xs text-zinc-500 font-sans">Application information and active configuration.</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-white/8 rounded-lg overflow-hidden">
        {items.map((item, idx) => (
          <div
            key={item.label}
            className={`flex items-center justify-between px-4 py-3 ${
              idx < items.length - 1 ? "border-b border-white/5" : ""
            }`}
          >
            <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">{item.label}</div>
            <div className="text-xs text-zinc-300 font-mono">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-zinc-900/60 border border-white/8 rounded-lg flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-[10px] text-zinc-500 font-sans leading-relaxed">
          <strong className="text-zinc-400">Security Reminder:</strong> All frontend permission checks are UX-layer controls only. Production security is enforced through Supabase Row Level Security (RLS), database functions (SECURITY DEFINER), and authorized RPCs. Never rely on hidden UI elements as authorization.
        </div>
      </div>
    </div>
  );
}
