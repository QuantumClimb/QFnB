import React from "react";
import { 
  Users, 
  Crown, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  ChevronRight, 
  Sparkles,
  Repeat
} from "lucide-react";
import { useGuests } from "../context/GuestContext";
import { Guest } from "../types";

export function GuestList() {
  const { guests, isLoading, openGuestDetail } = useGuests();

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Never";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  if (isLoading && guests.length === 0) {
    return (
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-12 text-center">
        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest">
          Loading guest directory...
        </p>
      </div>
    );
  }

  if (guests.length === 0) {
    return (
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-12 text-center space-y-3">
        <Users className="w-10 h-10 text-zinc-600 mx-auto" />
        <div className="font-mono text-sm font-bold text-white uppercase tracking-wider">
          No Guests Found
        </div>
        <p className="text-zinc-400 font-sans text-xs max-w-sm mx-auto">
          No guest records matched your active filter or search query. Try clearing filters or create a new profile.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
      {guests.map((guest) => {
        const isReturning = guest.visit_count >= 2;
        const hasAllergies = guest.allergies && guest.allergies.length > 0;
        const upcomingOccasion = guest.tags.find((t) => t.includes("BIRTHDAY") || t.includes("ANNIVERSARY"));

        return (
          <div
            key={guest.id}
            onClick={() => openGuestDetail(guest)}
            className="group bg-zinc-900/90 hover:bg-zinc-800/80 border border-white/5 hover:border-purple-500/40 rounded-2xl p-4 transition-all duration-150 cursor-pointer flex flex-col justify-between space-y-3 shadow-md hover:shadow-purple-500/5 relative overflow-hidden"
          >
            {/* VIP subtle highlight */}
            {guest.is_vip && (
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent pointer-events-none rounded-tr-2xl" />
            )}

            {/* Top Row: Name, VIP, Visit Badge */}
            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono text-xs font-black shrink-0 ${
                    guest.is_vip 
                      ? "bg-amber-400/20 text-amber-300 border border-amber-400/30" 
                      : isReturning 
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : "bg-zinc-800 text-zinc-300"
                  }`}>
                    {guest.is_vip ? <Crown className="w-4 h-4 text-amber-400" /> : `${guest.first_name[0]}${guest.last_name[0]}`}
                  </div>

                  <div>
                    <div className="font-sans font-bold text-sm text-white group-hover:text-purple-300 transition-colors flex items-center gap-1.5">
                      <span>{guest.display_name || `${guest.first_name} ${guest.last_name}`}</span>
                      {guest.is_vip && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] font-mono font-black uppercase">
                          VIP
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Repeat className="w-3 h-3 text-emerald-400" />
                        <strong className="text-zinc-200">{guest.visit_count}</strong> visits
                      </span>
                      <span>•</span>
                      <span>Last: {formatDate(guest.last_visit_at)}</span>
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </div>

              {/* Tag Chips */}
              <div className="flex flex-wrap gap-1 pt-1">
                {guest.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/5 text-[10px] font-mono text-zinc-300 uppercase"
                  >
                    {tag.replace(/_/g, " ")}
                  </span>
                ))}
                {guest.tags.length > 3 && (
                  <span className="text-[10px] font-mono text-zinc-500 px-1 py-0.5">
                    +{guest.tags.length - 3}
                  </span>
                )}
              </div>
            </div>

            {/* Middle Section: Allergy & Occasion Alerts */}
            {(hasAllergies || upcomingOccasion) && (
              <div className="space-y-1 pt-1">
                {hasAllergies && (
                  <div className="px-2 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-[10px] font-mono font-bold text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                    <span className="truncate">ALLERGY: {guest.allergies.join(", ")}</span>
                  </div>
                )}
                {upcomingOccasion && (
                  <div className="px-2 py-1 rounded-lg bg-pink-500/15 border border-pink-500/30 text-[10px] font-mono font-bold text-pink-300 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-pink-400 shrink-0" />
                    <span>{upcomingOccasion.replace(/_/g, " ")}</span>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Row: Contact & Seating Preferences */}
            <div className="pt-2 border-t border-white/5 space-y-1 text-[11px] font-mono text-zinc-400">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 truncate max-w-[180px]">
                  <Phone className="w-3 h-3 text-zinc-500 shrink-0" />
                  <span>{guest.phone || "No phone"}</span>
                </span>
                {guest.preferred_seating_area_name && (
                  <span className="flex items-center gap-1 text-purple-300 font-bold">
                    <MapPin className="w-3 h-3 text-purple-400 shrink-0" />
                    <span className="truncate max-w-[120px]">{guest.preferred_seating_area_name}</span>
                  </span>
                )}
              </div>

              {guest.last_reservation_at && (
                <div className="flex items-center gap-1 text-emerald-400 font-bold">
                  <Calendar className="w-3 h-3 shrink-0" />
                  <span>Next Booking: {formatDate(guest.last_reservation_at)}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
