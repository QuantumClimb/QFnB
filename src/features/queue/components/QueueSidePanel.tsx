import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  Sparkles, 
  Utensils, 
  Clock, 
  MapPin, 
  ArrowRight,
  ShieldCheck,
  Flame
} from "lucide-react";
import { useQueue } from "../context/QueueContext";
import { RestaurantTable } from "../../floor/types";
import { queueService } from "../services/queueService";

export function QueueSidePanel() {
  const { entries, openSeatModal, openNotifyModal, openDrawer, summary } = useQueue();
  const [recommendedTables, setRecommendedTables] = useState<RestaurantTable[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState<boolean>(false);

  // Ready Guests
  const readyGuests = entries.filter((e) => e.status === "ready");

  useEffect(() => {
    let isMounted = true;
    const fetchRecommended = async () => {
      try {
        setIsLoadingTables(true);
        // Look up top tables for typical party sizes 2-4
        const tables = await queueService.getRecommendedTables(2);
        if (isMounted) {
          setRecommendedTables(tables.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to load recommended tables:", err);
      } finally {
        if (isMounted) setIsLoadingTables(false);
      }
    };
    fetchRecommended();
    return () => {
      isMounted = false;
    };
  }, [entries]);

  return (
    <div className="space-y-4">
      {/* Ready Guests Callout */}
      <div className="bg-zinc-900/95 border border-emerald-500/30 rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              Ready For Seating
            </h3>
          </div>
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
            {readyGuests.length} Ready
          </span>
        </div>

        {readyGuests.length === 0 ? (
          <p className="text-zinc-500 text-xs font-sans mt-3">
            No tables currently marked ready. Use <span className="text-zinc-300">PREPARE TABLE</span> to assign cleaning tables.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {readyGuests.map((entry) => (
              <div
                key={entry.id}
                className="bg-zinc-800/80 border border-white/5 rounded-lg p-2.5 flex items-center justify-between gap-2"
              >
                <div>
                  <div className="font-sans text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="text-amber-400 font-mono">{entry.queue_number}</span>
                    {entry.guest_name}
                  </div>
                  <div className="text-zinc-400 text-[10px] font-mono mt-0.5 flex items-center gap-1">
                    <span>{entry.party_size}p</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">Tbl {entry.assigned_table_number || "Assigned"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openNotifyModal(entry)}
                    className="p-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-bold transition-colors"
                    title="Send SMS / WhatsApp"
                  >
                    Notify
                  </button>
                  <button
                    onClick={() => openSeatModal(entry)}
                    className="px-2.5 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-[10px] font-mono font-black uppercase tracking-wider shadow-sm transition-all"
                  >
                    Seat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Table Availability */}
      <div className="bg-zinc-900/95 border border-white/10 rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              Best Available Tables
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase">Live Floor</span>
        </div>

        {isLoadingTables ? (
          <div className="py-4 text-center text-zinc-500 font-mono text-xs">
            Scanning floor tables...
          </div>
        ) : recommendedTables.length === 0 ? (
          <p className="text-zinc-500 text-xs font-sans mt-3">
            All floor tables are currently occupied.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {recommendedTables.map((table) => {
              const isAvailable = table.status === "available";
              const isCleaning = table.status === "cleaning";

              return (
                <div
                  key={table.id}
                  className="bg-zinc-800/60 border border-white/5 rounded-lg p-2.5 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-zinc-700/60 border border-white/10 flex items-center justify-center font-mono text-xs font-black text-white">
                      {table.table_number}
                    </div>
                    <div>
                      <div className="font-mono text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                        <span>Cap {table.capacity}</span>
                        <span className="text-zinc-500">•</span>
                        <span className="text-zinc-400 capitalize">{table.shape}</span>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-zinc-500" />
                        {table.seating_area_name || "Main Floor"}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isAvailable ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                        AVAILABLE
                      </span>
                    ) : isCleaning ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-mono font-bold">
                        CLEANING
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold">
                        {table.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Host Pacing & Pressure Guidelines */}
      <div className="bg-zinc-900/95 border border-white/10 rounded-xl p-4 shadow-lg text-xs font-sans space-y-2.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
            Host Stand Pacing
          </h3>
        </div>
        <p className="text-zinc-400 text-[11px] leading-relaxed">
          Standard guest quote buffer is 15 minutes. High wait thresholds trigger automatically when average wait exceeds 30 minutes.
        </p>
        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-500">
          <span>Cleaning Buffer: 15m</span>
          <span>Turnover Target: 75m</span>
        </div>
      </div>
    </div>
  );
}
