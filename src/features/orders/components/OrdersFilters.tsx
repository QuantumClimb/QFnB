import React from "react";
import { Search, ChefHat, Wine, Cake, Bell, X, Filter } from "lucide-react";
import { useOrders } from "../context/OrderContext";
import { ServiceStationFilter } from "../types";

const STATIONS: { id: ServiceStationFilter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "all", label: "ALL STATIONS", icon: Filter },
  { id: "kitchen", label: "KITCHEN (HOT/COLD)", icon: ChefHat },
  { id: "bar", label: "COCKTAIL & WINE BAR", icon: Wine },
  { id: "dessert", label: "DESSERT & PASTRY", icon: Cake },
];

const COURSES = [
  { id: "all", label: "All Courses" },
  { id: "drinks", label: "Drinks" },
  { id: "starter", label: "Starters" },
  { id: "main", label: "Mains" },
  { id: "dessert", label: "Desserts" },
];

export function OrdersFilters() {
  const { 
    stationFilter, 
    setStationFilter, 
    courseFilter, 
    setCourseFilter, 
    searchQuery, 
    setSearchQuery 
  } = useOrders();

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-zinc-900/90 border border-white/10 p-3 rounded-xl">
      {/* Station Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        {STATIONS.map((st) => {
          const isActive = stationFilter === st.id;
          const Icon = st.icon;
          return (
            <button
              key={st.id}
              onClick={() => setStationFilter(st.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-purple-400 text-zinc-950 shadow-md shadow-purple-400/20"
                  : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-750"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {st.label}
            </button>
          );
        })}
      </div>

      {/* Course Selector & Search Input */}
      <div className="flex items-center gap-2">
        {/* Course Filter Dropdown */}
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="bg-zinc-800 border border-white/10 text-zinc-200 text-xs font-mono rounded-lg px-3 py-2 focus:outline-none focus:border-purple-400 cursor-pointer"
        >
          {COURSES.map((c) => (
            <option key={c.id} value={c.id} className="bg-zinc-900 text-white">
              {c.label}
            </option>
          ))}
        </select>

        {/* Search */}
        <div className="relative flex-1 md:w-56">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search order, table, dish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-800 border border-white/10 text-zinc-200 placeholder-zinc-500 text-xs font-mono rounded-lg pl-8 pr-7 py-2 focus:outline-none focus:border-purple-400"
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
