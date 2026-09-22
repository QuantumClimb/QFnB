import React from "react";
import { 
  Clock, 
  Users, 
  MessageSquare, 
  CheckCircle, 
  Send, 
  PhoneCall, 
  AlertCircle 
} from "lucide-react";
import { useDashboard } from "../context/DashboardContext";
import { WaitlistItem } from "../types";

export function ActiveWaitlistPanel() {
  const { data, notifyWaitlistGuest, seatWaitlistGuest } = useDashboard();
  const waitlist = data?.activeWaitlist || [];

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 font-mono text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-white uppercase tracking-wider text-sm">
            ACTIVE WAITLIST ({waitlist.length})
          </span>
        </div>
        <span className="text-[10px] text-amber-400 font-bold">
          {waitlist.reduce((acc, curr) => acc + curr.partySize, 0)} GUESTS WAITING
        </span>
      </div>

      {/* Empty State */}
      {waitlist.length === 0 ? (
        <div className="py-8 text-center text-zinc-500 font-sans text-xs">
          No guests currently on the waitlist. Walk-in capacity available immediately.
        </div>
      ) : (
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {waitlist.map((item: WaitlistItem) => {
            const isOverTime = item.elapsedMins > item.quotedTimeMins;
            const isNearTime = item.elapsedMins >= item.quotedTimeMins - 5;

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isOverTime 
                    ? "bg-rose-950/20 border-rose-500/30" 
                    : item.status === "notified"
                    ? "bg-amber-950/20 border-amber-500/30"
                    : "bg-zinc-950 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-xs">{item.guestName}</span>
                      <span className="font-mono text-zinc-400 text-[11px] flex items-center gap-1">
                        <Users className="w-3 h-3 text-zinc-400" />
                        {item.partySize}p
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-800 border border-white/10 text-[10px] text-zinc-300 font-mono">
                        {item.preferredSection}
                      </span>
                      {item.status === "notified" && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold animate-pulse">
                          NOTIFIED {item.notifiedAt ? `@ ${item.notifiedAt}` : ""}
                        </span>
                      )}
                    </div>

                    {/* Wait meter */}
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <div className="flex items-center gap-1">
                        <span className="text-zinc-500 text-[11px]">Wait:</span>
                        <span className={`font-bold ${
                          isOverTime ? "text-rose-400" : isNearTime ? "text-amber-400" : "text-emerald-400"
                        }`}>
                          {item.elapsedMins}m / {item.quotedTimeMins}m quote
                        </span>
                      </div>
                      <span className="text-zinc-600">•</span>
                      <span className="text-zinc-400 text-[11px]">{item.guestPhone}</span>
                    </div>

                    {item.notes && (
                      <p className="text-[11px] text-zinc-400 font-sans italic pt-0.5">
                        "{item.notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0 font-mono text-xs">
                    {item.status !== "notified" && (
                      <button
                        onClick={() => notifyWaitlistGuest(item.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs transition-colors"
                        title="Send SMS notification to guest phone"
                      >
                        <Send className="w-3 h-3" />
                        <span>Notify SMS</span>
                      </button>
                    )}

                    <button
                      onClick={() => seatWaitlistGuest(item.id, "Auto-Assigned")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all shadow-md active:scale-95"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Seat Now</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
