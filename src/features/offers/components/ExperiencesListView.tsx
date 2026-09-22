import React from "react";
import { Users, Clock, CalendarCheck, Sparkles, Building2, Eye, EyeOff, Plus } from "lucide-react";
import { useOffers } from "../context/OffersContext";
import { Experience, ExperienceStatus } from "../types";

export function ExperiencesListView() {
  const {
    experiences,
    isLoading,
    openExperienceDetail,
    openAttachExpModal,
    openCreateExpModal,
  } = useOffers();

  if (isLoading) {
    return (
      <div className="p-12 text-center text-zinc-500 font-mono text-xs">
        LOADING EXPERIENCES CATALOGUE...
      </div>
    );
  }

  if (experiences.length === 0) {
    return (
      <div className="p-12 bg-zinc-900 border border-white/10 text-center rounded-lg space-y-4">
        <Sparkles className="w-10 h-10 text-purple-400 mx-auto opacity-70" />
        <h3 className="text-base font-bold text-white uppercase font-mono">NO EXPERIENCES FOUND</h3>
        <p className="text-zinc-400 font-sans text-xs max-w-md mx-auto">
          No hospitality experiences match the active filters. Clear search criteria or create a new tasting menu, package, or event.
        </p>
        <button
          onClick={openCreateExpModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-mono text-xs font-bold transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>CREATE EXPERIENCE</span>
        </button>
      </div>
    );
  }

  const getStatusBadge = (status: ExperienceStatus) => {
    switch (status) {
      case "active":
        return "bg-emerald-950/80 text-emerald-400 border-emerald-500/30";
      case "draft":
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
      case "paused":
        return "bg-amber-950/80 text-amber-400 border-amber-500/30";
      case "expired":
        return "bg-rose-950/80 text-rose-400 border-rose-500/30";
      case "archived":
        return "bg-zinc-900 text-zinc-500 border-zinc-800 line-through";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  const getCategoryBadge = (category: string) => {
    return "bg-purple-950/60 text-purple-300 border-purple-800/40";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {experiences.map((exp) => (
        <div
          key={exp.id}
          onClick={() => openExperienceDetail(exp)}
          className="group cursor-pointer bg-zinc-900 border border-white/10 hover:border-purple-500/50 p-5 rounded-lg flex flex-col justify-between transition relative overflow-hidden shadow-sm hover:shadow-md hover:shadow-purple-950/20"
        >
          {exp.is_featured && (
            <div className="absolute top-0 right-0 bg-purple-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-bl uppercase tracking-wider">
              FEATURED
            </div>
          )}

          <div>
            {/* Top row: Category, Scope, Status */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
              <span
                className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getCategoryBadge(
                  exp.category
                )}`}
              >
                {exp.category.replace("_", " ")}
              </span>

              <span className="font-mono text-[10px] text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded flex items-center gap-1">
                <Building2 className="w-2.5 h-2.5" />
                {exp.outlet_id ? exp.outlet_name || "Outlet" : "All Outlets"}
              </span>

              <span
                className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded border ml-auto ${getStatusBadge(
                  exp.status
                )}`}
              >
                {exp.status}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-base font-bold text-white font-mono group-hover:text-purple-300 transition line-clamp-1">
              {exp.title}
            </h3>

            {/* Description */}
            <p className="text-zinc-400 font-sans text-xs mt-1.5 line-clamp-2 leading-relaxed">
              {exp.short_description || exp.description || "No description provided."}
            </p>

            {/* Spec row: Party size, duration */}
            <div className="flex flex-wrap items-center gap-3 text-zinc-400 font-mono text-xs mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                <span>
                  {exp.minimum_party_size}–{exp.maximum_party_size} guests
                </span>
              </div>

              {exp.duration_minutes && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{exp.duration_minutes} min</span>
                </div>
              )}

              <div className="flex items-center gap-1 ml-auto text-[10px] text-zinc-400">
                {exp.is_public ? (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Eye className="w-3 h-3" /> PUBLIC
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-zinc-400">
                    <EyeOff className="w-3 h-3" /> STAFF ONLY
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer: Pricing & Upcoming Bookings */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] text-zinc-400 uppercase">
                {exp.base_price === 0 ? "COURTESY / INTERNAL" : "CATALOGUE PRICE"}
              </div>
              <div className="font-mono text-sm font-black text-white">
                {exp.base_price !== null && exp.base_price !== undefined ? (
                  exp.base_price === 0 ? (
                    <span className="text-emerald-400">RM 0 (Complimentary)</span>
                  ) : (
                    <span>
                      {exp.currency_code} {exp.base_price.toLocaleString()}
                      {exp.category === "tasting" ? " / guest" : ""}
                    </span>
                  )
                ) : (
                  <span className="text-zinc-500">Custom / A La Carte</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="flex items-center gap-1 font-mono text-xs text-purple-300 font-semibold">
                  <CalendarCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>{exp.upcoming_bookings_count ?? 0} booked</span>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openAttachExpModal(exp);
                }}
                className="px-2.5 py-1 bg-purple-900/40 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 rounded font-mono text-[11px] font-bold transition"
              >
                ATTACH
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
