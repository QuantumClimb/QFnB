import React, { useState, useEffect } from "react";
import { 
  X, 
  Utensils, 
  Users, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  Sparkles
} from "lucide-react";
import { useQueue } from "../context/QueueContext";
import { RestaurantTable } from "../../floor/types";
import { queueService } from "../services/queueService";

export function SeatFromQueueModal() {
  const { 
    activeActionEntry, 
    isSeatModalOpen, 
    closeSeatModal, 
    seatGuest 
  } = useQueue();

  const [availableTables, setAvailableTables] = useState<RestaurantTable[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [isLoadingTables, setIsLoadingTables] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadTables = async () => {
      if (!activeActionEntry) return;
      try {
        setIsLoadingTables(true);
        const tables = await queueService.getRecommendedTables(
          activeActionEntry.party_size,
          activeActionEntry.preferred_seating_area_id || undefined
        );
        if (isMounted) {
          setAvailableTables(tables);
          if (activeActionEntry.assigned_table_id) {
            setSelectedTableId(activeActionEntry.assigned_table_id);
          } else if (tables.length > 0) {
            setSelectedTableId(tables[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch tables for seating:", err);
      } finally {
        if (isMounted) setIsLoadingTables(false);
      }
    };

    if (isSeatModalOpen && activeActionEntry) {
      loadTables();
    }
    return () => {
      isMounted = false;
    };
  }, [isSeatModalOpen, activeActionEntry]);

  if (!isSeatModalOpen || !activeActionEntry) return null;

  const handleSeat = async () => {
    if (!selectedTableId) {
      setErrorMsg("Please select a target table to seat this party");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await seatGuest({
        entryId: activeActionEntry.id,
        tableId: selectedTableId,
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to seat guest");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <Utensils className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-mono text-base font-black text-white uppercase tracking-wider">
                Seat Guest From Queue
              </h2>
              <div className="text-zinc-400 text-xs font-sans">
                {activeActionEntry.queue_number} • {activeActionEntry.guest_name} ({activeActionEntry.party_size} Guests)
              </div>
            </div>
          </div>
          <button
            onClick={closeSeatModal}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-zinc-400 font-mono text-xs uppercase mb-2">
              Select Compatible Dining Table *
            </label>

            {isLoadingTables ? (
              <div className="py-8 text-center text-zinc-500 font-mono text-xs">
                Scanning floor for compatible tables...
              </div>
            ) : availableTables.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
                No compatible tables currently available for a party of {activeActionEntry.party_size}.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {availableTables.map((table) => {
                  const isSelected = selectedTableId === table.id;
                  const isAvailable = table.status === "available";

                  return (
                    <div
                      key={table.id}
                      onClick={() => setSelectedTableId(table.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? "bg-amber-400/15 border-amber-400 text-white ring-1 ring-amber-400"
                          : "bg-zinc-800/80 border-white/5 text-zinc-300 hover:bg-zinc-800 hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono text-sm font-black ${
                          isSelected ? "bg-amber-400 text-zinc-950" : "bg-zinc-700 text-white"
                        }`}>
                          {table.table_number}
                        </div>
                        <div>
                          <div className="font-mono text-xs font-bold flex items-center gap-2">
                            <span>Capacity: {table.capacity}</span>
                            <span className="text-zinc-500">•</span>
                            <span className="text-zinc-400 capitalize">{table.shape}</span>
                          </div>
                          <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-zinc-500" />
                            {table.seating_area_name || "Main Area"}
                          </div>
                        </div>
                      </div>

                      <div>
                        {isAvailable ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                            AVAILABLE NOW
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold">
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

          <div className="bg-zinc-950/60 border border-white/5 p-3 rounded-xl text-xs font-mono text-zinc-400">
            ℹ️ Seating this party will update the Queue entry to <strong className="text-white">SEATED</strong> and transition the physical Floor Table to <strong className="text-white">SEATED</strong> with active dining timers.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3 bg-zinc-950/40">
          <button
            type="button"
            onClick={closeSeatModal}
            className="px-4 py-2 rounded-xl font-mono text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            CANCEL
          </button>
          <button
            type="button"
            disabled={!selectedTableId || isSubmitting}
            onClick={handleSeat}
            className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-mono text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-400/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "SEATING..." : "CONFIRM SEATING"}
          </button>
        </div>
      </div>
    </div>
  );
}
