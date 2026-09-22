import React, { useState } from "react";
import { X, Gift, Building2, Eye, EyeOff } from "lucide-react";
import { useOffers } from "../context/OffersContext";
import { AddonCategory, CreateAddonInput } from "../types";
import { useOrg } from "../../../context/OrgContext";

export function CreateAddonModal() {
  const { isCreateAddonModalOpen, closeCreateAddonModal, createAddon, experiences } = useOffers();
  const { currentOrg, currentOutlet } = useOrg();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<AddonCategory>("celebration");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("88");
  const [scope, setScope] = useState<"ORG" | "OUTLET">("ORG");
  const [experienceId, setExperienceId] = useState<string>("");
  const [isPublic, setIsPublic] = useState(true);
  const [maxQuantity, setMaxQuantity] = useState<number>(3);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isCreateAddonModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;
    setError(null);

    if (!name.trim()) {
      setError("Please enter an add-on name");
      return;
    }

    setIsSubmitting(true);
    try {
      const priceVal = price ? parseFloat(price) : null;
      const input: CreateAddonInput = {
        organization_id: currentOrg.id,
        outlet_id: scope === "OUTLET" && currentOutlet ? currentOutlet.id : null,
        experience_id: experienceId ? experienceId : null,
        name: name.trim(),
        description: description.trim() || null,
        category,
        price: priceVal !== null && !isNaN(priceVal) ? priceVal : null,
        currency_code: "MYR",
        is_public: isPublic,
        is_active: true,
        maximum_quantity: maxQuantity > 0 ? maxQuantity : null,
      };

      await createAddon(input);
      closeCreateAddonModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create add-on");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-zinc-900/90">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-purple-400" />
            <h3 className="font-mono text-base font-black text-white uppercase tracking-tight">
              CREATE HOSPITALITY ADD-ON
            </h3>
          </div>
          <button
            onClick={closeCreateAddonModal}
            className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 text-rose-300 font-mono text-xs rounded">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
              ADD-ON NAME *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Birthday Cake, Champagne Flutes, Rose Bouquet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-sans text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
                CATEGORY
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AddonCategory)}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-mono text-xs text-white"
              >
                <option value="celebration">Celebration</option>
                <option value="food">Food</option>
                <option value="beverage">Beverage</option>
                <option value="decor">Decor</option>
                <option value="personalization">Personalization</option>
                <option value="service">Service</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
                PRICE (MYR)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-mono text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-zinc-900/60 border border-white/5 p-3 rounded-lg">
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1">
                <Building2 className="w-3 h-3" /> OUTLET SCOPE
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as "ORG" | "OUTLET")}
                className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded font-mono text-xs text-zinc-200"
              >
                <option value="ORG">Organization-wide (All)</option>
                <option value="OUTLET">Current Outlet Only</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
                MAX QUANTITY
              </label>
              <input
                type="number"
                min="1"
                value={maxQuantity}
                onChange={(e) => setMaxQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded font-mono text-xs text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
              ATTACH TO SPECIFIC EXPERIENCE (OPTIONAL)
            </label>
            <select
              value={experienceId}
              onChange={(e) => setExperienceId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-mono text-xs text-white"
            >
              <option value="">General Add-On (Available to any reservation)</option>
              {experiences.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-mono text-[10px] text-zinc-400 uppercase font-bold">
              DESCRIPTION
            </label>
            <textarea
              rows={2}
              placeholder="e.g. 500g handcrafted cake with custom plaque..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded font-sans text-xs text-white"
            />
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeCreateAddonModal}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-mono text-xs font-semibold"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded font-mono text-xs font-bold transition shadow-lg shadow-purple-900/30"
            >
              {isSubmitting ? "SAVING..." : "SAVE ADD-ON"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
