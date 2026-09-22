import React, { useState } from "react";
import { X, ArrowRightLeft, Users, AlertTriangle } from "lucide-react";
import { useFloor } from "../context/FloorContext";
import { RestaurantTable } from "../types";

interface MoveGuestModalProps {
  isOpen: boolean;
  sourceTable: RestaurantTable | null;
  onClose: () => void;
}

export function MoveGuestModal({ isOpen, sourceTable, onClose }: MoveGuestModalProps) {
  const { tables, moveParty } = useFloor();
  const [destinationTableId, setDestinationTableId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !sourceTable || !sourceTable.current_session) return null;

  const partySize = sourceTable.current_session.partySize;

  // Find candidate destination tables: available or cleaning, not the source table
  const candidateTables = tables.filter((t) => 
    t.id !== sourceTable.id && 
    (t.status === "available" || t.status === "cleaning") &&
    t.is_active
  );

  const selectedTarget = candidateTables.find((t) => t.id === (destinationTableId || candidateTables[0]?.id));
  const isCapacityValid = selectedTarget ? selectedTarget.capacity >= partySize : false;

  const handleMove = async () => {
    if (!selectedTarget || !isCapacityValid) return;

    try {
      setIsSubmitting(true);
      await moveParty(sourceTable.id, selectedTarget.id);
      onClose();
    } catch (err) {
      console.error("Failed to move party:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl font-mono text-xs">
        
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-950 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white uppercase text-sm">
              RELOCATE TABLE {sourceTable.table_number}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          
          {/* Current Party Card */}
          <div className="p-3.5 bg-zinc-950 border border-purple-500/30 rounded-xl space-y-1">
            <div className="text-[10px] text-zinc-500 uppercase">ACTIVE PARTY TO RELOCATE</div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">{sourceTable.current_session.guestName}</span>
              <span className="font-bold text-purple-300 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {partySize} Guests
              </span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Current Station: Table {sourceTable.table_number} ({sourceTable.seating_area_name})
            </div>
          </div>

          {/* Destination Table Selection */}
          <div className="space-y-2">
            <label className="block text-zinc-400 text-[11px] uppercase tracking-wider">
              Select Destination Table
            </label>

            {candidateTables.length === 0 ? (
              <div className="p-4 rounded-xl bg-zinc-950 border border-rose-500/30 text-rose-300 text-center">
                No available destination tables on the floor right now.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {candidateTables.map((t) => {
                  const fits = t.capacity >= partySize;
                  const isCurrent = t.id === (destinationTableId || candidateTables[0]?.id);

                  return (
                    <div
                      key={t.id}
                      onClick={() => setDestinationTableId(t.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? "bg-purple-950/30 border-purple-500 ring-1 ring-purple-500"
                          : "bg-zinc-950 border-white/10 hover:border-white/20"
                      } ${!fits ? "opacity-50" : ""}`}
                    >
                      <div>
                        <div className="font-bold text-white">Table {t.table_number}</div>
                        <div className="text-[11px] text-zinc-400">{t.seating_area_name} • {t.shape}</div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="font-bold text-zinc-300">{t.capacity} Seats</div>
                        {!fits && (
                          <div className="text-[10px] text-rose-400 flex items-center gap-0.5 justify-end">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Too Small
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-950 border border-white/5 text-[11px] text-zinc-400 font-sans">
            Note: Moving this party will mark Table {sourceTable.table_number} as <strong>CLEANING</strong> and immediately transition Table {selectedTarget?.table_number || "..."} to <strong>SEATED</strong>.
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting || !isCapacityValid || candidateTables.length === 0}
              onClick={handleMove}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Moving..." : "Relocate Party"}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
