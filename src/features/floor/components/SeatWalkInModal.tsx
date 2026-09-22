import React, { useState } from "react";
import { X, UserCheck, Users, Clock } from "lucide-react";
import { useFloor } from "../context/FloorContext";
import { RestaurantTable } from "../types";

interface SeatWalkInModalProps {
  isOpen: boolean;
  targetTable: RestaurantTable | null;
  onClose: () => void;
}

export function SeatWalkInModal({ isOpen, targetTable, onClose }: SeatWalkInModalProps) {
  const { seatWalkIn, tables } = useFloor();

  const [selectedTableId, setSelectedTableId] = useState<string>(targetTable?.id || "");
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [partySize, setPartySize] = useState<number>(2);
  const [specialOccasion, setSpecialOccasion] = useState("");
  const [notes, setNotes] = useState("");
  const [expectedDurationMinutes, setExpectedDurationMinutes] = useState<number>(75);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available tables list
  const availableTables = tables.filter((t) => t.status === "available" || t.id === targetTable?.id);

  if (!isOpen) return null;

  const currentChosenTableId = targetTable?.id || selectedTableId || availableTables[0]?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !currentChosenTableId) return;

    try {
      setIsSubmitting(true);
      await seatWalkIn(currentChosenTableId, {
        guestName: guestName.trim(),
        phone: phone.trim() || "Walk-In Guest",
        partySize: Number(partySize),
        specialOccasion: specialOccasion.trim() || undefined,
        notes: notes.trim() || undefined,
        expectedDurationMinutes: Number(expectedDurationMinutes),
      });
      onClose();
      setGuestName("");
      setPhone("");
      setSpecialOccasion("");
      setNotes("");
    } catch (err) {
      console.error("Failed to seat walk-in:", err);
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
            <UserCheck className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white uppercase text-sm">SEAT WALK-IN PARTY</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1">
              Select Table
            </label>
            <select
              value={currentChosenTableId}
              onChange={(e) => setSelectedTableId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-xl text-white font-mono text-xs focus:outline-none"
            >
              {availableTables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.table_number} ({t.capacity} Seats • {t.seating_area_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1">
              Guest Name / Identifier *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Nicholas Ward (Walk-in)"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-xl text-white font-sans text-sm focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1">
                Party Size (Guests) *
              </label>
              <input
                type="number"
                required
                min={1}
                max={20}
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-xl text-white font-mono text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1">
                Est. Duration (Mins)
              </label>
              <select
                value={expectedDurationMinutes}
                onChange={(e) => setExpectedDurationMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-xl text-white font-sans text-xs focus:outline-none"
              >
                <option value={45}>45 mins (Drinks/Quick)</option>
                <option value={60}>60 mins (Standard Lunch)</option>
                <option value={75}>75 mins (Standard Dinner)</option>
                <option value={90}>90 mins (Full Dinner)</option>
                <option value={120}>120 mins (Celebration)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1">
              Occasion / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Date Night, Bar Drinks, Window view"
              value={specialOccasion}
              onChange={(e) => setSpecialOccasion(e.target.value)}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-xl text-white font-sans text-xs focus:outline-none"
            />
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
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Seating..." : "Seat Walk-In Party"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
