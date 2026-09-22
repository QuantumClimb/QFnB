import React from "react";
import { Gift, Plus, Building2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { useOffers } from "../context/OffersContext";
import { ExperienceAddon, AddonCategory } from "../types";

export function AddonsListView() {
  const { addons, isLoading, openCreateAddonModal, updateAddon } = useOffers();

  if (isLoading) {
    return (
      <div className="p-12 text-center text-zinc-500 font-mono text-xs">
        LOADING HOSPITALITY ADD-ONS...
      </div>
    );
  }

  if (addons.length === 0) {
    return (
      <div className="p-12 bg-zinc-900 border border-white/10 text-center rounded-lg space-y-4">
        <Gift className="w-10 h-10 text-purple-400 mx-auto opacity-70" />
        <h3 className="text-base font-bold text-white uppercase font-mono">NO ADD-ONS CONFIGURED</h3>
        <p className="text-zinc-400 font-sans text-xs max-w-md mx-auto">
          Create celebratory add-ons such as artisanal birthday cakes, floral arrangements, candlelight setups, or welcome flutes.
        </p>
        <button
          onClick={openCreateAddonModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-mono text-xs font-bold transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>CREATE ADD-ON</span>
        </button>
      </div>
    );
  }

  const getCategoryColor = (cat: AddonCategory) => {
    switch (cat) {
      case "celebration":
        return "text-purple-400 bg-purple-950/60 border-purple-800/40";
      case "decor":
        return "text-pink-400 bg-pink-950/60 border-pink-800/40";
      case "beverage":
        return "text-amber-400 bg-amber-950/60 border-amber-800/40";
      case "food":
        return "text-emerald-400 bg-emerald-950/60 border-emerald-800/40";
      case "personalization":
        return "text-sky-400 bg-sky-950/60 border-sky-800/40";
      case "service":
        return "text-indigo-400 bg-indigo-950/60 border-indigo-800/40";
      default:
        return "text-zinc-400 bg-zinc-800 border-zinc-700";
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {addons.map((addon) => (
          <div
            key={addon.id}
            className="bg-zinc-900 border border-white/10 hover:border-white/20 p-4 rounded-lg flex flex-col justify-between transition"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getCategoryColor(
                    addon.category
                  )}`}
                >
                  {addon.category}
                </span>

                <span className="font-mono text-[10px] text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded flex items-center gap-1">
                  <Building2 className="w-2.5 h-2.5" />
                  {addon.outlet_id ? addon.outlet_name || "Outlet" : "All Outlets"}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white font-mono">{addon.name}</h4>

              <p className="text-zinc-400 font-sans text-xs mt-1 leading-relaxed line-clamp-2">
                {addon.description || "No description provided."}
              </p>

              {addon.experience_title && (
                <div className="mt-2 text-[10px] font-mono text-purple-300">
                  Exclusive to: <span className="font-bold">{addon.experience_title}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between font-mono text-xs">
              <div>
                <span className="text-base font-black text-white">
                  {addon.price ? `${addon.currency_code} ${addon.price}` : "Free"}
                </span>
                {addon.maximum_quantity && (
                  <span className="text-[10px] text-zinc-500 block">
                    Max: {addon.maximum_quantity}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateAddon(addon.id, { is_active: !addon.is_active })}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold border transition ${
                    addon.is_active
                      ? "bg-emerald-950 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900"
                      : "bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300"
                  }`}
                >
                  {addon.is_active ? "ACTIVE" : "INACTIVE"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
