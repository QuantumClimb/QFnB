import React, { useState } from "react";
import { X, UserCheck, PlusCircle, Users, Clock, MapPin, FileText } from "lucide-react";
import { useDashboard } from "../context/DashboardContext";

interface QuickActionsModalProps {
  type: "walkin" | "waitlist" | null;
  onClose: () => void;
}

export function QuickActionsModal({ type, onClose }: QuickActionsModalProps) {
  const { addQuickWalkIn, addWaitlistEntry } = useDashboard();

  // Walk-in form state
  const [walkInName, setWalkInName] = useState("");
  const [walkInPartySize, setWalkInPartySize] = useState<number>(2);
  const [walkInSection, setWalkInSection] = useState("Main Dining Room");
  const [walkInTable, setWalkInTable] = useState("T-05");
  const [walkInNotes, setWalkInNotes] = useState("");

  // Waitlist form state
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistPhone, setWaitlistPhone] = useState("+60 1");
  const [waitlistPartySize, setWaitlistPartySize] = useState<number>(2);
  const [waitlistSection, setWaitlistSection] = useState<"Main Dining" | "Bar High-Tops" | "Terrace" | "Any">("Any");
  const [waitlistQuoteMins, setWaitlistQuoteMins] = useState<number>(20);
  const [waitlistNotes, setWaitlistNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!type) return null;

  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName.trim()) return;
    try {
      setIsSubmitting(true);
      await addQuickWalkIn({
        guestName: walkInName.trim(),
        partySize: Number(walkInPartySize),
        preferredSection: walkInSection,
        tableNumber: walkInTable.trim() || undefined,
        notes: walkInNotes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistName.trim()) return;
    try {
      setIsSubmitting(true);
      await addWaitlistEntry({
        guestName: waitlistName.trim(),
        guestPhone: waitlistPhone.trim(),
        partySize: Number(waitlistPartySize),
        preferredSection: waitlistSection,
        quotedTimeMins: Number(waitlistQuoteMins),
        notes: waitlistNotes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl font-mono text-xs">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-zinc-950 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {type === "walkin" ? (
              <>
                <UserCheck className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white uppercase text-sm">FAST WALK-IN SEATING</h3>
              </>
            ) : (
              <>
                <PlusCircle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white uppercase text-sm">ADD GUEST TO WAITLIST</h3>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {type === "walkin" ? (
          <form onSubmit={handleWalkInSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1.5">
                Guest Name / Reference
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Michael Thorne (Walk-in)"
                value={walkInName}
                onChange={(e) => setWalkInName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-lg text-white font-sans text-sm focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1.5">
                  Party Size (Covers)
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={walkInPartySize}
                  onChange={(e) => setWalkInPartySize(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-lg text-white font-mono text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1.5">
                  Assigned Table
                </label>
                <input
                  type="text"
                  placeholder="e.g. T-05"
                  value={walkInTable}
                  onChange={(e) => setWalkInTable(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-lg text-white font-mono text-sm focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1.5">
                Floor Section
              </label>
              <select
                value={walkInSection}
                onChange={(e) => setWalkInSection(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-lg text-white font-sans text-sm focus:outline-none"
              >
                <option value="Main Dining Room">Main Dining Room</option>
                <option value="Alfresco Terrace">Alfresco Terrace</option>
                <option value="Cocktail Bar & High Tops">Cocktail Bar & High Tops</option>
                <option value="Private Dining Suite">Private Dining Suite</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1.5">
                Service Notes / Dietary Requests
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Celebration dinner, no dairy"
                value={walkInNotes}
                onChange={(e) => setWalkInNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-lg text-white font-sans text-xs focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? "Seating..." : "Seat Guest Immediately"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleWaitlistSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1.5">
                Guest Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Nadia Razak"
                value={waitlistName}
                onChange={(e) => setWaitlistName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/15 focus:border-amber-500 rounded-lg text-white font-sans text-sm focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1.5">
                  Mobile (for SMS alert)
                </label>
                <input
                  type="text"
                  required
                  placeholder="+60 1x-xxx xxxx"
                  value={waitlistPhone}
                  onChange={(e) => setWaitlistPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/15 focus:border-amber-500 rounded-lg text-white font-mono text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1.5">
                  Party Size
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={waitlistPartySize}
                  onChange={(e) => setWaitlistPartySize(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/15 focus:border-amber-500 rounded-lg text-white font-mono text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1.5">
                  Zone Preference
                </label>
                <select
                  value={waitlistSection}
                  onChange={(e) => setWaitlistSection(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/15 focus:border-amber-500 rounded-lg text-white font-sans text-sm focus:outline-none"
                >
                  <option value="Any">First Available (Any)</option>
                  <option value="Main Dining">Main Dining</option>
                  <option value="Bar High-Tops">Bar High-Tops</option>
                  <option value="Terrace">Terrace</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1.5">
                  Quoted Wait Time
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={waitlistQuoteMins}
                    onChange={(e) => setWaitlistQuoteMins(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/15 focus:border-amber-500 rounded-lg text-white font-mono text-sm focus:outline-none"
                  />
                  <span className="text-zinc-400 text-xs">mins</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 text-[11px] uppercase tracking-wider mb-1.5">
                Notes
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Waiting in lounge bar"
                value={waitlistNotes}
                onChange={(e) => setWaitlistNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-950 border border-white/15 focus:border-amber-500 rounded-lg text-white font-sans text-xs focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? "Adding..." : "Add to Waitlist"}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
