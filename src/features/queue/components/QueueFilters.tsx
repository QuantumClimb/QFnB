import React from "react";
import { Search, MapPin, X } from "lucide-react";
import { useQueue } from "../context/QueueContext";

const STATUS_TABS = [
  { id: "ALL", label: "ALL" },
  { id: "WAITING", label: "WAITING" },
  { id: "NOTIFIED", label: "NOTIFIED" },
  { id: "PREPARING", label: "PREPARING" },
  { id: "READY", label: "READY" },
];

const SEATING_AREAS = [
  { id: "all", label: "All Seating Zones" },
  { id: "area-main", label: "Main Dining" },
  { id: "area-terrace", label: "Alfresco Terrace" },
  { id: "area-bar", label: "Cocktail Bar" },
  { id: "area-pdr", label: "Private Dining Suite" },
];

export function QueueFilters() {
  const { 
    statusFilter, 
    setStatusFilter, 
    areaFilter, 
    setAreaFilter, 
    searchQuery, 
    setSearchQuery 
  } = useQueue();

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-zinc-900/90 border border-white/10 p-3 rounded-xl">
      {/* Status Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20"
                  : "bg-zinc-800/70 text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Area & Search */}
      <div className="flex items-center gap-2">
        {/* Seating Area Dropdown */}
        <div className="relative min-w-[170px]">
          <MapPin className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="w-full bg-zinc-800 border border-white/10 text-zinc-200 text-xs font-mono rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-amber-400/50 cursor-pointer appearance-none"
          >
            {SEATING_AREAS.map((area) => (
              <option key={area.id} value={area.id} className="bg-zinc-900 text-zinc-200">
                {area.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 md:w-56">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search guest or #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-800 border border-white/10 text-zinc-200 placeholder-zinc-500 text-xs font-mono rounded-lg pl-8 pr-7 py-2 focus:outline-none focus:border-amber-400/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
