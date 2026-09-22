import React from "react";
import { Search, Filter, X } from "lucide-react";
import { useOffers } from "../context/OffersContext";
import { ExperienceCategory } from "../types";

export function OffersFilterBar() {
  const { filterOptions, setFilterOptions, activeTab } = useOffers();

  const categories: { id: ExperienceCategory | "ALL"; label: string }[] = [
    { id: "ALL", label: "ALL CATEGORIES" },
    { id: "tasting", label: "TASTING" },
    { id: "celebration", label: "CELEBRATION" },
    { id: "romantic", label: "ROMANTIC" },
    { id: "wine", label: "WINE" },
    { id: "private_dining", label: "PRIVATE DINING" },
    { id: "live_entertainment", label: "LIVE ENTERTAINMENT" },
    { id: "corporate", label: "CORPORATE" },
    { id: "family", label: "FAMILY" },
  ];

  const statuses = [
    { id: "ALL", label: "ALL STATUSES" },
    { id: "active", label: "ACTIVE" },
    { id: "draft", label: "DRAFT" },
    { id: "paused", label: "PAUSED" },
    { id: "expired", label: "EXPIRED" },
    { id: "archived", label: "ARCHIVED" },
  ];

  const hasActiveFilters =
    filterOptions.searchQuery !== "" ||
    filterOptions.category !== "ALL" ||
    filterOptions.status !== "ALL" ||
    filterOptions.visibility !== "ALL" ||
    filterOptions.scope !== "ALL";

  const clearFilters = () => {
    setFilterOptions({
      searchQuery: "",
      category: "ALL",
      status: "ALL",
      visibility: "ALL",
      scope: "ALL",
    });
  };

  return (
    <div className="bg-zinc-900/90 border border-white/10 p-3 md:p-4 rounded-lg space-y-3">
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by title, description or package..."
            value={filterOptions.searchQuery || ""}
            onChange={(e) =>
              setFilterOptions((prev) => ({ ...prev, searchQuery: e.target.value }))
            }
            className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded font-sans text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition"
          />
          {filterOptions.searchQuery && (
            <button
              onClick={() => setFilterOptions((prev) => ({ ...prev, searchQuery: "" }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Scope selector */}
        <select
          value={filterOptions.scope || "ALL"}
          onChange={(e) =>
            setFilterOptions((prev) => ({
              ...prev,
              scope: e.target.value as "ALL" | "ORG_WIDE" | "CURRENT_OUTLET",
            }))
          }
          className="bg-black/40 border border-white/10 text-zinc-300 font-mono text-xs rounded px-3 py-2 focus:outline-none focus:border-purple-500"
        >
          <option value="ALL">SCOPE: ALL</option>
          <option value="ORG_WIDE">ORGANIZATION-WIDE CATALOGUE</option>
          <option value="CURRENT_OUTLET">CURRENT OUTLET ONLY</option>
        </select>

        {/* Status selector */}
        <select
          value={filterOptions.status || "ALL"}
          onChange={(e) =>
            setFilterOptions((prev) => ({ ...prev, status: e.target.value }))
          }
          className="bg-black/40 border border-white/10 text-zinc-300 font-mono text-xs rounded px-3 py-2 focus:outline-none focus:border-purple-500"
        >
          {statuses.map((s) => (
            <option key={s.id} value={s.id}>
              STATUS: {s.label}
            </option>
          ))}
        </select>

        {/* Visibility filter (Experiences/Offers) */}
        {(activeTab === "EXPERIENCES" || activeTab === "OFFERS") && (
          <select
            value={filterOptions.visibility || "ALL"}
            onChange={(e) =>
              setFilterOptions((prev) => ({
                ...prev,
                visibility: e.target.value as "ALL" | "PUBLIC" | "STAFF_ONLY",
              }))
            }
            className="bg-black/40 border border-white/10 text-zinc-300 font-mono text-xs rounded px-3 py-2 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">VISIBILITY: ALL</option>
            <option value="PUBLIC">PUBLIC BOOKABLE</option>
            <option value="STAFF_ONLY">STAFF INTERNAL ONLY</option>
          </select>
        )}

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2.5 py-2 text-zinc-400 hover:text-white font-mono text-xs hover:bg-white/5 rounded transition"
          >
            <X className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>
        )}
      </div>

      {/* Category Pills (Only on EXPERIENCES tab) */}
      {activeTab === "EXPERIENCES" && (
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none text-xs">
          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> CATEGORY:
          </span>
          {categories.map((c) => {
            const isSelected = (filterOptions.category || "ALL") === c.id;
            return (
              <button
                key={c.id}
                onClick={() =>
                  setFilterOptions((prev) => ({ ...prev, category: c.id }))
                }
                className={`px-2.5 py-1 rounded font-mono text-[11px] font-semibold whitespace-nowrap transition ${
                  isSelected
                    ? "bg-purple-600 text-white"
                    : "bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
