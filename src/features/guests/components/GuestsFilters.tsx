import React from "react";
import { Search, X, Filter, ArrowUpDown, AlertTriangle } from "lucide-react";
import { useGuests } from "../context/GuestContext";

export function GuestsFilters() {
  const { filterOptions, setFilterOptions, guests } = useGuests();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterOptions((prev) => ({ ...prev, searchQuery: e.target.value }));
  };

  const handleClearSearch = () => {
    setFilterOptions((prev) => ({ ...prev, searchQuery: "" }));
  };

  const handleTagClick = (tag: string) => {
    setFilterOptions((prev) => ({
      ...prev,
      tag: prev.tag === tag ? "ALL" : tag,
    }));
  };

  const toggleAllergies = () => {
    setFilterOptions((prev) => ({
      ...prev,
      hasAllergies: !prev.hasAllergies,
    }));
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterOptions((prev) => ({
      ...prev,
      sortBy: e.target.value as "last_visit" | "visit_count" | "name" | "created_at",
    }));
  };

  const tags = [
    { id: "ALL", label: "All Tags" },
    { id: "VIP", label: "VIP" },
    { id: "RETURNING", label: "Returning" },
    { id: "WINE_LOVER", label: "Wine Lover" },
    { id: "VEGETARIAN", label: "Vegetarian" },
    { id: "BUSINESS_DINER", label: "Business" },
    { id: "HOTEL_GUEST", label: "Hotel Guest" },
  ];

  return (
    <div className="bg-zinc-900/90 border border-white/5 p-4 rounded-2xl space-y-3.5">
      {/* Search Bar + Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search guests by name, phone (+60...), or email..."
            value={filterOptions.searchQuery || ""}
            onChange={handleSearchChange}
            className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-9 py-2.5 text-xs font-sans text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-400 transition-colors"
          />
          {filterOptions.searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Allergy Quick Filter */}
          <button
            onClick={toggleAllergies}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-mono text-xs font-bold border transition-colors cursor-pointer ${
              filterOptions.hasAllergies
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                : "bg-zinc-950 border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>ALLERGIES ONLY</span>
          </button>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 bg-zinc-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-zinc-400">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={filterOptions.sortBy || "last_visit"}
              onChange={handleSortChange}
              className="bg-transparent text-xs font-mono text-white focus:outline-none cursor-pointer pr-2"
            >
              <option value="last_visit" className="bg-zinc-900">Recent Visit</option>
              <option value="visit_count" className="bg-zinc-900">Most Visits</option>
              <option value="name" className="bg-zinc-900">Guest Name</option>
              <option value="created_at" className="bg-zinc-900">Date Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tag Filter Chips & Results Count */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" />
            Tags:
          </span>
          {tags.map((t) => {
            const isSelected = (filterOptions.tag || "ALL") === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTagClick(t.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-purple-500 text-white shadow-xs"
                    : "bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="text-[11px] font-mono text-zinc-500">
          Showing <span className="font-bold text-white">{guests.length}</span> profiles
        </div>
      </div>
    </div>
  );
}
