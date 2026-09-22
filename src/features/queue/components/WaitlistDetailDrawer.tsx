import React, { useState } from "react";
import { 
  X, 
  Users, 
  Clock, 
  Phone, 
  MapPin, 
  Sparkles, 
  Bell, 
  CheckCircle2, 
  Utensils, 
  XCircle, 
  AlertTriangle,
  QrCode,
  ExternalLink,
  ShieldAlert,
  Send,
  UserCheck
} from "lucide-react";
import { useQueue } from "../context/QueueContext";
import { WaitlistEntry, WaitlistStatus } from "../types";

export function WaitlistDetailDrawer() {
  const { 
    selectedEntry, 
    isDrawerOpen, 
    closeDrawer, 
    changeStatus, 
    updateQuotedWait, 
    openSeatModal, 
    openNotifyModal,
    markTableReady,
    cancelEntry,
    markNoResponse
  } = useQueue();

  const [customQuote, setCustomQuote] = useState<number | "">("");

  if (!isDrawerOpen || !selectedEntry) return null;

  const calculateElapsedMinutes = (joinedAt: string): number => {
    const diffMs = Date.now() - new Date(joinedAt).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const elapsed = calculateElapsedMinutes(selectedEntry.joined_at);
  const isOverdue = elapsed > selectedEntry.quoted_wait_minutes && (selectedEntry.status === "waiting" || selectedEntry.status === "notified");
  const guestStatusUrl = `https://q-fnb.app/guest/queue/${selectedEntry.guest_status_token}`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-150">
      {/* Backdrop */}
      <div 
        onClick={closeDrawer}
        className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-zinc-900 border-l border-white/10 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-5 border-b border-white/10 bg-zinc-950/60 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-black text-amber-400">
                  {selectedEntry.queue_number}
                </span>
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest">
                  WAITLIST DETAIL
                </span>
              </div>
              <h2 className="text-xl font-bold text-white font-sans mt-0.5">
                {selectedEntry.guest_name}
              </h2>
            </div>
            <button
              onClick={closeDrawer}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Status & Timing Highlight */}
            <div className="bg-zinc-950/80 border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400 uppercase">Current Status</span>
                <span className="px-2.5 py-0.5 rounded-full border border-amber-400/40 bg-amber-400/10 text-amber-300 font-mono text-xs font-black uppercase">
                  {selectedEntry.status.replace("_", " ")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs font-mono">
                <div className="bg-zinc-900 p-2.5 rounded-lg">
                  <div className="text-zinc-500 text-[10px] uppercase">Elapsed Time</div>
                  <div className={`font-bold mt-1 text-sm ${isOverdue ? "text-rose-400" : "text-white"}`}>
                    {elapsed} min
                    {isOverdue && <span className="text-[10px] text-rose-400 ml-1">(! Overdue)</span>}
                  </div>
                </div>

                <div className="bg-zinc-900 p-2.5 rounded-lg">
                  <div className="text-zinc-500 text-[10px] uppercase">Quoted Wait</div>
                  <div className="font-bold text-zinc-200 mt-1 text-sm">
                    {selectedEntry.quoted_wait_minutes} min
                  </div>
                </div>
              </div>

              {/* Adjust Quoted Wait Quick Buttons */}
              <div className="pt-2 flex items-center justify-between gap-1.5">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">Pacing:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuotedWait(selectedEntry.id, selectedEntry.quoted_wait_minutes + 5)}
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono font-bold"
                  >
                    +5m
                  </button>
                  <button
                    onClick={() => updateQuotedWait(selectedEntry.id, selectedEntry.quoted_wait_minutes + 10)}
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono font-bold"
                  >
                    +10m
                  </button>
                  <button
                    onClick={() => updateQuotedWait(selectedEntry.id, Math.max(5, selectedEntry.quoted_wait_minutes - 5))}
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono font-bold"
                  >
                    -5m
                  </button>
                </div>
              </div>
            </div>

            {/* Guest Contact & Party Info */}
            <div className="bg-zinc-900 border border-white/5 rounded-xl p-4 space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-500 uppercase">Party Size</span>
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {selectedEntry.party_size} Guests
                </span>
              </div>

              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-500 uppercase">Phone</span>
                <span className="font-bold flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  {selectedEntry.phone}
                </span>
              </div>

              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-500 uppercase">Preferred Zone</span>
                <span className="font-bold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  {selectedEntry.preferred_seating_area_name || "Any Available"}
                </span>
              </div>

              {selectedEntry.assigned_table_number && (
                <div className="flex items-center justify-between text-zinc-300 pt-2 border-t border-white/5">
                  <span className="text-zinc-500 uppercase">Assigned Table</span>
                  <span className="font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
                    {selectedEntry.assigned_table_number}
                  </span>
                </div>
              )}
            </div>

            {/* Special Occasions / Dietary / Notes */}
            {(selectedEntry.notes || selectedEntry.special_occasion || selectedEntry.dietary_requirements || selectedEntry.allergies) && (
              <div className="bg-zinc-950/60 border border-white/5 rounded-xl p-4 space-y-2 text-xs">
                {selectedEntry.special_occasion && (
                  <div className="text-amber-300 font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Occasion: {selectedEntry.special_occasion}</span>
                  </div>
                )}
                {selectedEntry.allergies && (
                  <div className="text-rose-400 font-mono flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Allergies: {selectedEntry.allergies.join(", ")}</span>
                  </div>
                )}
                {selectedEntry.dietary_requirements && (
                  <div className="text-cyan-300 font-mono">
                    Dietary: {selectedEntry.dietary_requirements.join(", ")}
                  </div>
                )}
                {selectedEntry.notes && (
                  <p className="text-zinc-400 font-sans italic pt-1 border-t border-white/5">
                    "{selectedEntry.notes}"
                  </p>
                )}
              </div>
            )}

            {/* Guest Status Token & Contactless Preview */}
            <div className="bg-zinc-950/90 border border-white/10 rounded-xl p-4 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-bold uppercase flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-cyan-400" />
                  Guest Web Status
                </span>
                <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                  Token Secure
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-sans">
                Guests track live queue status via token link (ready for Q RESTOBAR):
              </p>
              <div className="bg-zinc-900 border border-white/5 p-2 rounded-lg text-[10px] text-zinc-300 break-all select-all flex items-center justify-between gap-2">
                <span className="truncate">{guestStatusUrl}</span>
                <ExternalLink className="w-3 h-3 text-zinc-400 shrink-0" />
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-2 pt-2">
              {/* Seat Guest */}
              <button
                onClick={() => openSeatModal(selectedEntry)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-mono text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-400/20 transition-all active:scale-95 cursor-pointer"
              >
                <Utensils className="w-4 h-4" />
                SEAT GUEST AT TABLE
              </button>

              {/* Notify Guest */}
              <button
                onClick={() => openNotifyModal(selectedEntry)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                NOTIFY GUEST (SMS / WHATSAPP)
              </button>

              {/* Mark Ready */}
              {selectedEntry.status === "table_preparing" && (
                <button
                  onClick={() => markTableReady(selectedEntry.id)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  MARK TABLE READY
                </button>
              )}

              {/* Secondary Status Options */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => markNoResponse(selectedEntry.id)}
                  className="py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-white font-mono text-[11px] font-bold uppercase transition-colors"
                >
                  NO RESPONSE
                </button>
                <button
                  onClick={() => cancelEntry(selectedEntry.id, "Cancelled by host")}
                  className="py-2 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-mono text-[11px] font-bold uppercase transition-colors"
                >
                  CANCEL ENTRY
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
