import React, { useState } from "react";
import { X, PlusCircle, Calendar, Clock, Users, MapPin, Sparkles, AlertTriangle, ShieldCheck } from "lucide-react";
import { useReservations } from "../context/ReservationContext";
import { BookingSource, DepositStatus } from "../types";

interface CreateReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateReservationModal({ isOpen, onClose }: CreateReservationModalProps) {
  const { createReservation, seatingAreas } = useReservations();

  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("+60 ");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [reservationDate, setReservationDate] = useState("2026-09-19");
  const [reservationTime, setReservationTime] = useState("19:30");
  const [partySize, setPartySize] = useState<number>(2);
  const [seatingAreaId, setSeatingAreaId] = useState(seatingAreas[0]?.id || "area-main");
  const [assignedTableLabel, setAssignedTableLabel] = useState("");
  const [bookingSource, setBookingSource] = useState<BookingSource>("staff");
  const [specialOccasion, setSpecialOccasion] = useState("");
  const [dietaryRequirements, setDietaryRequirements] = useState("");
  const [allergies, setAllergies] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [expectedDurationMinutes, setExpectedDurationMinutes] = useState<number>(90);
  const [depositStatus, setDepositStatus] = useState<DepositStatus>("not_required");
  const [depositAmount, setDepositAmount] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !phone.trim()) return;

    try {
      setIsSubmitting(true);
      await createReservation({
        guest_name: guestName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        whatsapp: whatsapp.trim() || phone.trim(),
        reservation_date: reservationDate,
        reservation_time: reservationTime,
        party_size: Number(partySize),
        seating_area_id: seatingAreaId,
        assigned_table_label: assignedTableLabel.trim() || undefined,
        booking_source: bookingSource,
        special_occasion: specialOccasion.trim() || undefined,
        dietary_requirements: dietaryRequirements.trim() || undefined,
        allergies: allergies.trim() || undefined,
        special_requests: specialRequests.trim() || undefined,
        expected_duration_minutes: Number(expectedDurationMinutes),
        deposit_status: depositStatus,
        deposit_amount: depositStatus === "paid" ? Number(depositAmount) : 0,
      });

      onClose();
      // Reset form
      setGuestName("");
      setPhone("+60 ");
      setEmail("");
      setWhatsapp("");
      setSpecialOccasion("");
      setDietaryRequirements("");
      setAllergies("");
      setSpecialRequests("");
      setAssignedTableLabel("");
    } catch (err) {
      console.error("Failed to create reservation:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl font-mono text-xs">
        
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-950 border-b border-white/10 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white uppercase text-sm">NEW STAFF RESERVATION</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Section 1: Guest Contact */}
          <div className="space-y-3">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
              1. GUEST INFORMATION
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1">
                  Guest Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Julian Vance"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-xl text-white font-sans text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1">
                  Primary Mobile Phone *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+60 12-345 6789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-xl text-white font-mono text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="julian.vance@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-xl text-white font-sans text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1">
                  WhatsApp Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="+60 12-345 6789"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-xl text-white font-mono text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Schedule & Seating */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
              2. SCHEDULE & SEATING ALLOCATION
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1">
                  Reservation Date *
                </label>
                <input
                  type="date"
                  required
                  value={reservationDate}
                  onChange={(e) => setReservationDate(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-xl text-white font-mono text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1">
                  Arrival Time *
                </label>
                <input
                  type="time"
                  required
                  value={reservationTime}
                  onChange={(e) => setReservationTime(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-xl text-white font-mono text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1">
                  Party Size (Covers) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={30}
                  value={partySize}
                  onChange={(e) => setPartySize(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-xl text-white font-mono text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1">
                  Seating Area
                </label>
                <select
                  value={seatingAreaId}
                  onChange={(e) => setSeatingAreaId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-xl text-white font-sans text-xs focus:outline-none"
                >
                  {seatingAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1">
                  Assigned Table (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. T-12"
                  value={assignedTableLabel}
                  onChange={(e) => setAssignedTableLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-xl text-white font-mono text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1">
                  Booking Channel
                </label>
                <select
                  value={bookingSource}
                  onChange={(e) => setBookingSource(e.target.value as any)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-xl text-white font-sans text-xs focus:outline-none"
                >
                  <option value="staff">Staff Entry</option>
                  <option value="phone">Phone Call</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="walk_in">Walk-In</option>
                  <option value="hotel_concierge">Hotel Concierge</option>
                  <option value="other">Other Channel</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Hospitality Preferences */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
              3. HOSPITALITY PREFERENCES & DIETARY
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1">
                  Special Occasion
                </label>
                <input
                  type="text"
                  placeholder="e.g. Birthday, Anniversary, Business"
                  value={specialOccasion}
                  onChange={(e) => setSpecialOccasion(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-xl text-white font-sans text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1">
                  Allergies & Medical Restrictions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Strict Shellfish, Peanuts, Gluten"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-white/15 focus:border-rose-500 rounded-xl text-white font-sans text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1">
                  Dietary Preferences
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vegetarian, Halal Prepared, Pescatarian"
                  value={dietaryRequirements}
                  onChange={(e) => setDietaryRequirements(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-xl text-white font-sans text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1">
                  Expected Duration (Mins)
                </label>
                <select
                  value={expectedDurationMinutes}
                  onChange={(e) => setExpectedDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-xl text-white font-sans text-xs focus:outline-none"
                >
                  <option value={60}>60 minutes (Quick)</option>
                  <option value={90}>90 minutes (Standard Dinner)</option>
                  <option value={120}>120 minutes (Tasting Menu / VIP)</option>
                  <option value={150}>150 minutes (Large Celebration)</option>
                  <option value={180}>180 minutes (Full Service)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1">
                Special Requests / Staff Service Notes
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Guest requested quiet corner away from kitchen traffic, pre-ordered vintage wine."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-xl text-white font-sans text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Section 4: Deposit Info */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1">
                  Deposit Status
                </label>
                <select
                  value={depositStatus}
                  onChange={(e) => setDepositStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-xl text-white font-sans text-xs focus:outline-none"
                >
                  <option value="not_required">Not Required</option>
                  <option value="pending">Pending Payment</option>
                  <option value="paid">Deposit Paid</option>
                </select>
              </div>

              {depositStatus === "paid" && (
                <div>
                  <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1">
                    Deposit Amount (MYR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-white/15 focus:border-emerald-500 rounded-xl text-white font-mono text-xs focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3 sticky bottom-0 bg-zinc-900 pb-2">
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
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-950/40 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Reservation"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
