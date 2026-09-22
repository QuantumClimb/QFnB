import React, { useState } from "react";
import { X, CheckCircle2, Users, Clock, CalendarCheck } from "lucide-react";
import { useFloor } from "../context/FloorContext";
import { RestaurantTable } from "../types";

interface SeatReservationModalProps {
  isOpen: boolean;
  targetTable: RestaurantTable | null;
  onClose: () => void;
}

// Development list of arriving/confirmed bookings ready for table assignment
const arrivingBookings = [
  {
    id: "res-001",
    guestName: "Alexander Wright",
    phone: "+60 12-384 9912",
    partySize: 4,
    time: "19:30",
    occasion: "Executive Business Dinner",
    allergies: "None",
    dietaryNotes: "Prefers Vintage Pinot",
  },
  {
    id: "res-002",
    guestName: "Datin Sofia Chen",
    phone: "+60 17-822 4110",
    partySize: 6,
    time: "19:45",
    occasion: "50th Birthday Celebration",
    allergies: "Strict Shellfish Allergy",
    dietaryNotes: "1x Pescatarian",
  },
  {
    id: "res-003",
    guestName: "Dr. Kenneth O'Connor",
    phone: "+60 19-445 1198",
    partySize: 2,
    time: "19:15",
    occasion: "Wedding Anniversary",
    allergies: "None",
    dietaryNotes: "Amuse-bouche requested",
  },
  {
    id: "res-004",
    guestName: "Melissa Tan",
    phone: "+60 11-209 8831",
    partySize: 2,
    time: "20:00",
    occasion: "First Visit / Date Night",
    allergies: "Peanuts",
    dietaryNotes: "Vegetarian options",
  },
];

export function SeatReservationModal({ isOpen, targetTable, onClose }: SeatReservationModalProps) {
  const { seatReservation } = useFloor();
  const [selectedResId, setSelectedResId] = useState(arrivingBookings[0]?.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !targetTable) return null;

  const handleSeat = async () => {
    const targetBooking = arrivingBookings.find((b) => b.id === selectedResId);
    if (!targetBooking) return;

    try {
      setIsSubmitting(true);
      await seatReservation(targetTable.id, targetBooking.id, {
        guestName: targetBooking.guestName,
        partySize: targetBooking.partySize,
        phone: targetBooking.phone,
        specialOccasion: targetBooking.occasion,
        allergies: targetBooking.allergies,
        dietaryNotes: targetBooking.dietaryNotes,
        expectedDurationMinutes: 90,
      });
      onClose();
    } catch (err) {
      console.error("Failed to seat reservation:", err);
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
            <CalendarCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white uppercase text-sm">
              SEAT RESERVATION AT TABLE {targetTable.table_number}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-zinc-950 border border-white/10 flex items-center justify-between">
            <span className="text-zinc-400">Target Station:</span>
            <span className="font-bold text-white">
              {targetTable.table_number} ({targetTable.capacity} Seats • {targetTable.seating_area_name})
            </span>
          </div>

          <div className="space-y-2">
            <label className="block text-zinc-400 text-[11px] uppercase tracking-wider">
              Select Arrived / Incoming Reservation
            </label>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {arrivingBookings.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedResId(b.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedResId === b.id
                      ? "bg-purple-950/30 border-purple-500 ring-1 ring-purple-500"
                      : "bg-zinc-950 border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{b.guestName}</span>
                    <span className="font-bold text-purple-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {b.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400 text-[11px] mt-1 font-sans">
                    <span className="flex items-center gap-1 font-mono text-zinc-300">
                      <Users className="w-3 h-3" />
                      {b.partySize}p
                    </span>
                    <span>• {b.occasion}</span>
                  </div>
                </div>
              ))}
            </div>
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
              disabled={isSubmitting}
              onClick={handleSeat}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Seating..." : "Confirm & Seat Party"}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
