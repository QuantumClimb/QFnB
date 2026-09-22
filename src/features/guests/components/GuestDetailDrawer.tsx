import React, { useState } from "react";
import { 
  X, 
  Crown, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Sparkles, 
  Edit3, 
  Plus, 
  Trash2, 
  MessageSquare, 
  History, 
  UtensilsCrossed, 
  Send,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Repeat,
  Heart
} from "lucide-react";
import { useGuests } from "../context/GuestContext";

export function GuestDetailDrawer() {
  const {
    selectedGuest,
    isDetailDrawerOpen,
    closeGuestDetail,
    openEditModal,
    guestVisits,
    upcomingReservations,
    recentOrders,
    addTag,
    removeTag,
    addHospitalityNote,
  } = useGuests();

  const [newTagInput, setNewTagInput] = useState<string>("");
  const [newNoteInput, setNewNoteInput] = useState<string>("");
  const [isAddingNote, setIsAddingNote] = useState<boolean>(false);

  if (!isDetailDrawerOpen || !selectedGuest) return null;

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    await addTag(selectedGuest.id, newTagInput.trim());
    setNewTagInput("");
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteInput.trim()) return;
    setIsAddingNote(true);
    try {
      await addHospitalityNote(selectedGuest.id, newNoteInput.trim());
      setNewNoteInput("");
    } finally {
      setIsAddingNote(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const isReturning = selectedGuest.visit_count >= 2;
  const hasAllergies = selectedGuest.allergies && selectedGuest.allergies.length > 0;
  const hasDietary = selectedGuest.dietary_requirements && selectedGuest.dietary_requirements.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-150">
      {/* Backdrop */}
      <div 
        onClick={closeGuestDetail}
        className="absolute inset-0 bg-black/80 backdrop-blur-xs"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-zinc-900 border-l border-white/10 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 border-b border-white/10 bg-zinc-950/70 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-black text-sm shrink-0 ${
                selectedGuest.is_vip 
                  ? "bg-amber-400 text-zinc-950 shadow-lg shadow-amber-400/20" 
                  : isReturning 
                  ? "bg-purple-500 text-white" 
                  : "bg-zinc-800 text-zinc-200"
              }`}>
                {selectedGuest.is_vip ? <Crown className="w-6 h-6" /> : `${selectedGuest.first_name[0]}${selectedGuest.last_name[0]}`}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-sans font-black text-lg text-white">
                    {selectedGuest.display_name || `${selectedGuest.first_name} ${selectedGuest.last_name}`}
                  </h2>
                  {selectedGuest.is_vip && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 font-mono text-[10px] font-black uppercase tracking-wider">
                      VIP
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mt-0.5">
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <Repeat className="w-3.5 h-3.5" />
                    {selectedGuest.visit_count} Completed Visits
                  </span>
                  <span>•</span>
                  <span>Member since {formatDate(selectedGuest.first_visit_at || selectedGuest.created_at)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => openEditModal(selectedGuest)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs font-bold transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>EDIT</span>
              </button>

              <button
                onClick={closeGuestDetail}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* 1. Deterministic Hospitality Intelligence Panel */}
            <div className="bg-gradient-to-br from-purple-950/40 via-zinc-950 to-zinc-950 border border-purple-500/20 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between text-purple-400 font-mono text-[10px] uppercase font-black tracking-wider">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  HOSPITALITY RECOGNITION PANEL
                </span>
                <span className="text-zinc-500 font-normal">Deterministic Rules</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-white/5">
                  <div className="text-zinc-500 text-[10px] uppercase">Dining Tier</div>
                  <div className="font-bold text-white mt-0.5">
                    {selectedGuest.is_vip ? "VIP Member" : isReturning ? "Returning Patron" : "New Patron"}
                  </div>
                </div>

                <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-white/5">
                  <div className="text-zinc-500 text-[10px] uppercase">Seating Preference</div>
                  <div className="font-bold text-purple-300 mt-0.5 truncate">
                    {selectedGuest.preferred_seating_area_name 
                      ? `${selectedGuest.preferred_seating_area_name}${selectedGuest.preferred_table_number ? ` (${selectedGuest.preferred_table_number})` : ""}`
                      : "No Preference Recorded"}
                  </div>
                </div>
              </div>

              {selectedGuest.date_of_birth && (
                <div className="flex items-center gap-2 text-[11px] font-mono text-pink-300 bg-pink-500/10 border border-pink-500/20 px-3 py-1.5 rounded-xl">
                  <Heart className="w-3.5 h-3.5 text-pink-400" />
                  <span>Birthday: {formatDate(selectedGuest.date_of_birth)}</span>
                  {selectedGuest.anniversary_date && (
                    <>
                      <span className="text-zinc-500">•</span>
                      <span>Anniversary: {formatDate(selectedGuest.anniversary_date)}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 2. Allergy & Dietary Safety Section (Highest Operational Priority) */}
            {(hasAllergies || hasDietary) && (
              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase font-black tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  DIETARY & ALLERGY SAFETY (PROMINENT STAFF ALERT)
                </div>

                <div className="bg-zinc-950 border border-rose-500/30 rounded-2xl p-4 space-y-2.5">
                  {hasAllergies && (
                    <div>
                      <div className="text-[10px] font-mono text-rose-400 font-bold uppercase mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        CRITICAL ALLERGIES
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedGuest.allergies.map((allergy) => (
                          <span
                            key={allergy}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-xs font-black uppercase"
                          >
                            ⚠️ {allergy}
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] font-sans text-zinc-400 mt-1.5">
                        Flag to kitchen and bar stations on every order ticket. Confirm preparation with floor server.
                      </p>
                    </div>
                  )}

                  {hasDietary && (
                    <div className="pt-2 border-t border-white/5">
                      <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase mb-1">
                        DIETARY REQUIREMENTS
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedGuest.dietary_requirements.map((req) => (
                          <span
                            key={req}
                            className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold uppercase"
                          >
                            {req.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Contact Details & Marketing Consent */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase font-black tracking-wider text-zinc-400">
                CONTACT INFORMATION & PRIVACY
              </div>

              <div className="bg-zinc-950 border border-white/5 rounded-2xl p-4 space-y-3 text-xs font-mono">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Phone className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>{selectedGuest.phone || "No phone provided"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-zinc-300 truncate">
                    <Mail className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="truncate">{selectedGuest.email || "No email provided"}</span>
                  </div>
                </div>

                {/* Consent Flags */}
                <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="text-zinc-500 uppercase">Marketing Opt-ins:</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      {selectedGuest.marketing_email_opt_in ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-zinc-600" />
                      )}
                      Email
                    </span>
                    <span className="flex items-center gap-1">
                      {selectedGuest.marketing_whatsapp_opt_in ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-zinc-600" />
                      )}
                      WhatsApp
                    </span>
                    <span className="flex items-center gap-1">
                      {selectedGuest.marketing_sms_opt_in ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-zinc-600" />
                      )}
                      SMS
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Upcoming Reservations */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase font-black tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                UPCOMING RESERVATIONS
              </div>

              {upcomingReservations.length === 0 ? (
                <div className="p-4 bg-zinc-950/60 border border-white/5 rounded-xl text-center text-zinc-500 font-mono text-xs">
                  No upcoming reservations currently scheduled for this guest.
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingReservations.map((res) => (
                    <div
                      key={res.id}
                      className="p-3 bg-zinc-950 border border-emerald-500/20 rounded-xl flex items-center justify-between font-mono text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span className="text-emerald-400">{res.reservation_date}</span>
                          <span>•</span>
                          <span>{res.reservation_time}</span>
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {res.party_size} Guests • {res.seating_area_name}
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase">
                        {res.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Recent Orders (Hospitality Recognition) */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase font-black tracking-wider text-zinc-400 flex items-center gap-1.5">
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
                RECENT DISHES & BEVERAGES
              </div>

              {recentOrders.length === 0 ? (
                <div className="p-4 bg-zinc-950/60 border border-white/5 rounded-xl text-center text-zinc-500 font-mono text-xs">
                  No previous order tickets linked to this guest profile.
                </div>
              ) : (
                <div className="space-y-2">
                  {recentOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3 bg-zinc-950 border border-white/5 rounded-xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                        <span className="font-bold text-white">{ord.order_number}</span>
                        <span>Table {ord.table_number}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {ord.dishes.map((dish, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-zinc-800 border border-white/5 text-[10px] font-mono text-zinc-300"
                          >
                            {dish}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Hospitality Notes & Special Occasions */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase font-black tracking-wider text-zinc-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                HOSPITALITY SERVICE NOTES
              </div>

              <div className="bg-zinc-950 border border-white/5 rounded-2xl p-4 space-y-3">
                {selectedGuest.hospitality_notes ? (
                  <p className="font-sans text-xs text-zinc-300 leading-relaxed whitespace-pre-line italic">
                    "{selectedGuest.hospitality_notes}"
                  </p>
                ) : (
                  <p className="font-sans text-xs text-zinc-500 italic">
                    No service notes recorded yet.
                  </p>
                )}

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="pt-2 border-t border-white/5 flex gap-2">
                  <input
                    type="text"
                    placeholder="Add operational service note..."
                    value={newNoteInput}
                    onChange={(e) => setNewNoteInput(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-sans text-white focus:outline-none focus:border-purple-400"
                  />
                  <button
                    type="submit"
                    disabled={isAddingNote || !newNoteInput.trim()}
                    className="px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-mono text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                  >
                    ADD
                  </button>
                </form>
              </div>
            </div>

            {/* 7. Tags Manager */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase font-black tracking-wider text-zinc-400">
                GUEST TAGS & RECOGNITION
              </div>

              <div className="bg-zinc-950 border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {selectedGuest.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 border border-white/5 font-mono text-xs text-zinc-200 uppercase"
                    >
                      <span>{tag.replace(/_/g, " ")}</span>
                      <button
                        onClick={() => removeTag(selectedGuest.id, tag)}
                        className="text-zinc-500 hover:text-rose-400 ml-1 transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <form onSubmit={handleAddTag} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add tag (e.g. WINE_LOVER, VIP)..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-purple-400"
                  />
                  <button
                    type="submit"
                    disabled={!newTagInput.trim()}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    + TAG
                  </button>
                </form>
              </div>
            </div>

            {/* 8. Visit History Timeline */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase font-black tracking-wider text-zinc-400 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-emerald-400" />
                VISIT HISTORY TIMELINE ({guestVisits.length})
              </div>

              {guestVisits.length === 0 ? (
                <div className="p-4 bg-zinc-950/60 border border-white/5 rounded-xl text-center text-zinc-500 font-mono text-xs">
                  No past visits recorded yet.
                </div>
              ) : (
                <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-3 before:w-0.5 before:bg-zinc-800">
                  {guestVisits.map((visit) => (
                    <div key={visit.id} className="relative pl-7 space-y-1">
                      <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-purple-500 border-2 border-zinc-900" />

                      <div className="bg-zinc-950 border border-white/5 rounded-xl p-3 space-y-1.5">
                        <div className="flex items-center justify-between font-mono text-xs">
                          <span className="font-black text-white">{formatDate(visit.visit_date)}</span>
                          <span className="text-zinc-500">{visit.outlet_name || "Quantum Climb"}</span>
                        </div>

                        <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2">
                          <span>{visit.party_size || 2} Guests</span>
                          {visit.seating_area_name && (
                            <>
                              <span>•</span>
                              <span>{visit.seating_area_name}</span>
                            </>
                          )}
                          {visit.table_number && (
                            <>
                              <span>•</span>
                              <span className="text-purple-300">Table {visit.table_number}</span>
                            </>
                          )}
                        </div>

                        {visit.occasion && (
                          <div className="text-[10px] font-mono text-pink-300 bg-pink-500/10 px-2 py-0.5 rounded inline-block">
                            {visit.occasion}
                          </div>
                        )}

                        {visit.service_notes && (
                          <p className="text-[11px] font-sans text-zinc-400 italic">
                            "{visit.service_notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-white/10 bg-zinc-950/80 flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500">
              ID: {selectedGuest.id} • Org: {selectedGuest.organization_id}
            </span>

            <button
              onClick={closeGuestDetail}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-bold transition-colors cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
