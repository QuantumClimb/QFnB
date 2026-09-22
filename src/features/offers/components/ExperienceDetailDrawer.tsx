import React from "react";
import {
  X,
  Sparkles,
  Users,
  Clock,
  Building2,
  Eye,
  EyeOff,
  Edit,
  Pause,
  Play,
  Archive,
  CalendarCheck,
  Gift,
  FileText,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";
import { useOffers } from "../context/OffersContext";

export function ExperienceDetailDrawer() {
  const {
    isDetailDrawerOpen,
    closeExperienceDetail,
    selectedExperience,
    changeExperienceStatus,
    openEditExpModal,
    openAttachExpModal,
    reservationExperiences,
    addons,
  } = useOffers();

  if (!isDetailDrawerOpen || !selectedExperience) return null;

  const exp = selectedExperience;

  // Attached upcoming reservations for this experience
  const linkedBookings = reservationExperiences.filter(
    (re) => re.experience_id === exp.id && re.status !== "cancelled"
  );

  // Available add-ons matching this experience or group-wide
  const relevantAddons = addons.filter(
    (a) => a.experience_id === null || a.experience_id === exp.id
  );

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-zinc-950 border-l border-white/10 h-full flex flex-col justify-between shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">
        <div>
          {/* Header */}
          <div className="p-5 md:p-6 border-b border-white/10 bg-zinc-900/90 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-purple-300 font-bold">
                  {exp.category.replace("_", " ")}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold">
                  {exp.status.toUpperCase()}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400 flex items-center gap-1">
                  <Building2 className="w-2.5 h-2.5" />
                  {exp.outlet_name || "All Outlets"}
                </span>
              </div>

              <button
                onClick={closeExperienceDetail}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-xl md:text-2xl font-black text-white font-mono uppercase mt-3">
              {exp.title}
            </h2>

            <div className="flex items-center gap-4 mt-2 text-xs font-mono text-zinc-400">
              <span className="flex items-center gap-1">
                {exp.is_public ? (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Eye className="w-3.5 h-3.5" /> PUBLICLY BOOKABLE
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-400">
                    <EyeOff className="w-3.5 h-3.5" /> STAFF INTERNAL ONLY
                  </span>
                )}
              </span>
              <span>•</span>
              <span>SLUG: {exp.slug}</span>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 md:p-6 space-y-6">
            {/* Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-900 border border-white/10 p-4 rounded-lg">
              <div>
                <div className="font-mono text-[10px] text-zinc-500 uppercase">PARTY RANGE</div>
                <div className="font-mono text-sm font-bold text-white flex items-center gap-1 mt-1">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  {exp.minimum_party_size}–{exp.maximum_party_size} pax
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] text-zinc-500 uppercase">DURATION</div>
                <div className="font-mono text-sm font-bold text-white flex items-center gap-1 mt-1">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  {exp.duration_minutes ? `${exp.duration_minutes} min` : "Flexible"}
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] text-zinc-500 uppercase">CATALOGUE PRICE</div>
                <div className="font-mono text-sm font-bold text-white mt-1">
                  {exp.base_price !== null && exp.base_price !== undefined ? (
                    exp.base_price === 0 ? (
                      <span className="text-emerald-400">RM 0 (Complimentary)</span>
                    ) : (
                      `${exp.currency_code} ${exp.base_price}`
                    )
                  ) : (
                    "Custom"
                  )}
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] text-zinc-500 uppercase">BOOKING LEAD</div>
                <div className="font-mono text-sm font-bold text-white mt-1">
                  {exp.booking_lead_minutes
                    ? exp.booking_lead_minutes >= 60
                      ? `${Math.round(exp.booking_lead_minutes / 60)} hrs`
                      : `${exp.booking_lead_minutes} min`
                    : "None"}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="font-mono text-xs font-bold text-zinc-300 uppercase tracking-wider">
                DESCRIPTION & MENU NOTES
              </h4>
              <p className="text-zinc-300 font-sans text-sm leading-relaxed bg-zinc-900/50 border border-white/5 p-4 rounded-lg">
                {exp.description || exp.short_description || "No description provided."}
              </p>
            </div>

            {/* Availability Schedule Rules */}
            <div className="space-y-2">
              <h4 className="font-mono text-xs font-bold text-zinc-300 uppercase tracking-wider">
                SERVICE AVAILABILITY & PACING
              </h4>
              {exp.availability_rules && exp.availability_rules.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {exp.availability_rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="bg-zinc-900 border border-white/5 p-2.5 rounded flex items-center justify-between font-mono text-xs"
                    >
                      <span className="text-purple-300 font-bold">
                        {dayNames[rule.day_of_week]}
                      </span>
                      <span className="text-zinc-400">
                        {rule.start_time} – {rule.end_time}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-zinc-500 font-mono bg-zinc-900 p-3 rounded border border-white/5">
                  Available during standard outlet operating hours.
                </div>
              )}
            </div>

            {/* Preferred Seating Area */}
            {exp.preferred_seating_area_name && (
              <div className="space-y-1">
                <div className="font-mono text-[10px] text-zinc-500 uppercase">
                  PREFERRED SEATING AREA
                </div>
                <div className="font-mono text-xs text-white bg-zinc-900 border border-white/5 p-2.5 rounded">
                  {exp.preferred_seating_area_name}
                </div>
              </div>
            )}

            {/* Guest Terms & Internal Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1 font-mono text-xs font-bold text-zinc-400 uppercase">
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  <span>GUEST TERMS</span>
                </div>
                <div className="text-xs text-zinc-400 font-sans bg-zinc-900 border border-white/5 p-3 rounded min-h-[70px]">
                  {exp.guest_terms || "Standard cancellation and dining policy applies."}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1 font-mono text-xs font-bold text-amber-400 uppercase">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>INTERNAL STAFF NOTES</span>
                </div>
                <div className="text-xs text-zinc-400 font-sans bg-amber-950/20 border border-amber-500/20 p-3 rounded min-h-[70px]">
                  {exp.internal_notes || "No special staff instructions recorded."}
                </div>
              </div>
            </div>

            {/* Available Add-Ons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-mono text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-purple-400" />
                  <span>RECOMMENDED ADD-ONS</span>
                </h4>
                <span className="font-mono text-[11px] text-zinc-500">
                  {relevantAddons.length} available
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {relevantAddons.slice(0, 4).map((addon) => (
                  <div
                    key={addon.id}
                    className="bg-zinc-900 border border-white/5 p-2.5 rounded flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-white line-clamp-1">
                        {addon.name}
                      </div>
                      <div className="text-[10px] text-zinc-500 uppercase font-mono">
                        {addon.category}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-purple-300">
                      {addon.price ? `RM ${addon.price}` : "Free"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attached Reservations */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-mono text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>UPCOMING RESERVATIONS ATTACHED</span>
                </h4>
                <span className="font-mono text-[11px] text-purple-400 font-bold">
                  {linkedBookings.length} bookings
                </span>
              </div>

              {linkedBookings.length > 0 ? (
                <div className="space-y-2">
                  {linkedBookings.map((b) => (
                    <div
                      key={b.id}
                      className="bg-zinc-900 border border-white/5 p-3 rounded flex items-center justify-between text-xs font-mono"
                    >
                      <div>
                        <span className="font-bold text-white">{b.guest_name}</span>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          {b.reservation_date} • {b.reservation_time} • {b.party_size} pax
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold uppercase border border-emerald-500/20">
                          {b.status}
                        </span>
                        <div className="text-[10px] text-zinc-500 mt-1">
                          Snapshot: RM {b.unit_price_snapshot ?? 0}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-zinc-900 border border-white/5 text-center rounded font-mono text-xs text-zinc-500">
                  No reservations currently linked to this package.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Operational Actions */}
        <div className="p-4 md:p-5 border-t border-white/10 bg-zinc-900/95 sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {exp.status === "active" ? (
              <button
                onClick={() => changeExperienceStatus(exp.id, "paused")}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-600/30 rounded font-mono text-xs font-semibold transition"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>PAUSE</span>
              </button>
            ) : (
              <button
                onClick={() => changeExperienceStatus(exp.id, "active")}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-600/30 rounded font-mono text-xs font-semibold transition"
              >
                <Play className="w-3.5 h-3.5" />
                <span>ACTIVATE</span>
              </button>
            )}

            {exp.status !== "archived" && (
              <button
                onClick={() => changeExperienceStatus(exp.id, "archived")}
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-white/5 rounded font-mono text-xs transition"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>ARCHIVE</span>
              </button>
            )}

            <button
              onClick={() => openEditExpModal(exp)}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 rounded font-mono text-xs font-semibold transition"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>EDIT</span>
            </button>
          </div>

          <button
            onClick={() => openAttachExpModal(exp)}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-mono text-xs font-bold transition shadow-lg shadow-purple-900/30"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>ATTACH TO RESERVATION</span>
          </button>
        </div>
      </div>
    </div>
  );
}
