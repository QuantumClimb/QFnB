import React from "react";
import { Tag, Calendar, Sparkles, Building2, Eye, EyeOff, Plus, CheckCircle2 } from "lucide-react";
import { useOffers } from "../context/OffersContext";
import { Offer, OfferStatus } from "../types";

export function OffersListView() {
  const { offers, isLoading, changeOfferStatus, openCreateOfferModal } = useOffers();

  if (isLoading) {
    return (
      <div className="p-12 text-center text-zinc-500 font-mono text-xs">
        LOADING HOSPITALITY OFFERS...
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="p-12 bg-zinc-900 border border-white/10 text-center rounded-lg space-y-4">
        <Tag className="w-10 h-10 text-purple-400 mx-auto opacity-70" />
        <h3 className="text-base font-bold text-white uppercase font-mono">NO OFFERS CONFIGURED</h3>
        <p className="text-zinc-400 font-sans text-xs max-w-md mx-auto">
          Create guest perks, weekday dining privileges, champagne upgrades, and celebratory packages.
        </p>
        <button
          onClick={openCreateOfferModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-mono text-xs font-bold transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>CREATE OFFER</span>
        </button>
      </div>
    );
  }

  const getStatusBadge = (status: OfferStatus) => {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {offers.map((offer) => (
        <div
          key={offer.id}
          className="bg-zinc-900 border border-white/10 hover:border-white/20 p-5 rounded-lg flex flex-col justify-between transition relative overflow-hidden"
        >
          {offer.is_featured && (
            <div className="absolute top-0 right-0 bg-emerald-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-bl uppercase tracking-wider">
              FEATURED PERK
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
              <span className="font-mono text-[10px] text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded flex items-center gap-1">
                <Building2 className="w-2.5 h-2.5" />
                {offer.outlet_id ? offer.outlet_name || "Outlet" : "All Outlets"}
              </span>

              <span
                className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded border ml-auto ${getStatusBadge(
                  offer.status
                )}`}
              >
                {offer.status}
              </span>
            </div>

            <h3 className="text-base font-bold text-white font-mono">{offer.title}</h3>

            <p className="text-zinc-400 font-sans text-xs mt-1.5 line-clamp-2 leading-relaxed">
              {offer.short_description || offer.description}
            </p>

            {offer.experience_title && (
              <div className="mt-3 p-2 bg-purple-950/30 border border-purple-500/20 rounded flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <div className="text-[11px] font-mono text-purple-300 truncate">
                  Linked: <span className="font-bold">{offer.experience_title}</span>
                </div>
              </div>
            )}

            <div className="space-y-1.5 mt-3 pt-3 border-t border-white/5 text-[11px] font-mono text-zinc-400">
              {offer.eligibility_notes && (
                <div className="flex items-start gap-1.5">
                  <span className="text-zinc-500 shrink-0">ELIGIBILITY:</span>
                  <span className="text-zinc-300 line-clamp-1">{offer.eligibility_notes}</span>
                </div>
              )}
              {offer.redemption_notes && (
                <div className="flex items-start gap-1.5">
                  <span className="text-zinc-500 shrink-0">REDEMPTION:</span>
                  <span className="text-zinc-300 line-clamp-1">{offer.redemption_notes}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1.5 text-zinc-500 text-[10px]">
              {offer.is_public ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <Eye className="w-3 h-3" /> PUBLIC
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-400">
                  <EyeOff className="w-3 h-3" /> STAFF ONLY
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {offer.status === "active" ? (
                <button
                  onClick={() => changeOfferStatus(offer.id, "paused")}
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/20 rounded text-[10px] font-bold"
                >
                  PAUSE
                </button>
              ) : (
                <button
                  onClick={() => changeOfferStatus(offer.id, "active")}
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-emerald-300 border border-emerald-500/20 rounded text-[10px] font-bold"
                >
                  ACTIVATE
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
