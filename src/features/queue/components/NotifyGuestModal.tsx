import React, { useState } from "react";
import { 
  X, 
  Bell, 
  Send, 
  MessageSquare, 
  Smartphone, 
  ShieldCheck, 
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useQueue } from "../context/QueueContext";
import { NotificationChannel } from "../types";

export function NotifyGuestModal() {
  const { 
    activeActionEntry, 
    isNotifyModalOpen, 
    closeNotifyModal, 
    notifyGuest 
  } = useQueue();

  const [selectedChannel, setSelectedChannel] = useState<NotificationChannel>("whatsapp");
  const [isSending, setIsSending] = useState(false);

  if (!isNotifyModalOpen || !activeActionEntry) return null;

  const tableLabel = activeActionEntry.assigned_table_number || "Host Stand";
  const statusUrl = `https://q-fnb.app/guest/queue/${activeActionEntry.guest_status_token}`;

  const messagePreview = selectedChannel === "whatsapp"
    ? `🌟 [Q F&B OS] Great news, ${activeActionEntry.guest_name}! Your table (${tableLabel}) at Quantum Climb is READY. Please proceed to the host stand within 10 minutes.\n\nTrack status: ${statusUrl}`
    : `[Q F&B OS] Hi ${activeActionEntry.guest_name}, table ${tableLabel} is ready for your party of ${activeActionEntry.party_size}. Please see the host. ${statusUrl}`;

  const handleSend = async () => {
    try {
      setIsSending(true);
      await notifyGuest(activeActionEntry, selectedChannel);
      closeNotifyModal();
    } catch (err) {
      console.error("Failed to dispatch simulated notification:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="font-mono text-base font-black text-white uppercase tracking-wider">
                Notify Guest (Table Ready)
              </h2>
              <div className="text-zinc-400 text-xs font-sans">
                {activeActionEntry.queue_number} • {activeActionEntry.guest_name}
              </div>
            </div>
          </div>
          <button
            onClick={closeNotifyModal}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Channel Selection */}
          <div>
            <label className="block text-zinc-400 font-mono text-xs uppercase mb-2">
              Notification Channel
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedChannel("whatsapp")}
                className={`p-3 rounded-xl border flex items-center gap-2.5 font-mono text-xs font-bold transition-all cursor-pointer ${
                  selectedChannel === "whatsapp"
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500"
                    : "bg-zinc-800/80 border-white/5 text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp Business</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedChannel("sms")}
                className={`p-3 rounded-xl border flex items-center gap-2.5 font-mono text-xs font-bold transition-all cursor-pointer ${
                  selectedChannel === "sms"
                    ? "bg-cyan-500/15 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500"
                    : "bg-zinc-800/80 border-white/5 text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>SMS Paging</span>
              </button>
            </div>
          </div>

          {/* Message Preview */}
          <div>
            <label className="block text-zinc-400 font-mono text-xs uppercase mb-1.5">
              Message Preview
            </label>
            <div className="bg-zinc-950 border border-white/10 p-3.5 rounded-xl font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {messagePreview}
            </div>
            <div className="text-[11px] font-mono text-zinc-500 mt-1.5 flex items-center justify-between">
              <span>Recipient: {activeActionEntry.phone}</span>
              <span>Table: {tableLabel}</span>
            </div>
          </div>

          {/* Simulation Notice */}
          <div className="bg-cyan-950/20 border border-cyan-500/30 p-3 rounded-xl text-xs font-sans text-cyan-300/90 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong>DEV PREVIEW Mode:</strong> Notification dispatch is simulated locally in-browser without actual SMS/WhatsApp gateway charges.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3 bg-zinc-950/40">
          <button
            type="button"
            onClick={closeNotifyModal}
            className="px-4 py-2 rounded-xl font-mono text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            CANCEL
          </button>
          <button
            type="button"
            disabled={isSending}
            onClick={handleSend}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-mono text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            {isSending ? "DISPATCHING..." : "DISPATCH NOTIFICATION"}
          </button>
        </div>
      </div>
    </div>
  );
}
