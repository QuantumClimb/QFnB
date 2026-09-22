import React from "react";
import { 
  Search, 
  Filter, 
  Calendar, 
  SlidersHorizontal, 
  X, 
  Layers, 
  Users 
} from "lucide-react";
import { useReservations } from "../context/ReservationContext";
import { ReservationStatus, BookingSource } from "../types";

export function ReservationFilterBar() {
  const { filters, updateFilter, seatingAreas, setFilters } = useReservations();

  const handleReset = () => {
    setFilters({
      viewMode: filters.viewMode,
      searchQuery: "",
      date: filters.viewMode === "today" ? "2026-09-19" : undefined,
      status: "all",
      seatingAreaId: "all",
      bookingSource: "all",
      minPartySize: undefined,
    });
  };

  const hasActiveFilters = 
    filters.searchQuery !== "" ||
    filters.status !== "all" ||
    filters.seatingAreaId !== "all" ||
    filters.bookingSource !== "all" ||
    (filters.minPartySize !== undefined && filters.minPartySize > 0) ||
    (filters.viewMode !== "today" && filters.date !== undefined);

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-4 font-mono text-xs shadow-lg space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Guest Name, Phone, Email, Reference or Table..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter("searchQuery", e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-xl text-white font-sans text-xs focus:outline-none placeholder:text-zinc-500 transition-colors"
          />
          {filters.searchQuery && (
            <button
              onClick={() => updateFilter("searchQuery", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Controls & Reset */}
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/10 rounded-xl transition-colors self-end md:self-center flex-shrink-0"
          >
            <X className="w-3.5 h-3.5 text-zinc-400" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Filter Dropdown Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
        
        {/* Date Filter (Only editable if not Today tab) */}
        <div>
          <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
            Date
          </label>
          <input
            type="date"
            value={filters.date || ""}
            onChange={(e) => updateFilter("date", e.target.value || undefined)}
            className="w-full px-3 py-2 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-xl text-white font-mono text-xs focus:outline-none"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
            Status
          </label>
          <select
            value={filters.status || "all"}
            onChange={(e) => updateFilter("status", e.target.value as any)}
            className="w-full px-3 py-2 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-xl text-white font-sans text-xs focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="confirmed">Confirmed</option>
            <option value="arrived">Arrived</option>
            <option value="seated">Seated</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
        </div>

        {/* Seating Area Filter */}
        <div>
          <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
            Seating Area
          </label>
          <select
            value={filters.seatingAreaId || "all"}
            onChange={(e) => updateFilter("seatingAreaId", e.target.value)}
            className="w-full px-3 py-2 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-xl text-white font-sans text-xs focus:outline-none"
          >
            <option value="all">All Areas</option>
            {seatingAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </div>

        {/* Booking Source Filter */}
        <div>
          <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
            Source Channel
          </label>
          <select
            value={filters.bookingSource || "all"}
            onChange={(e) => updateFilter("bookingSource", e.target.value as any)}
            className="w-full px-3 py-2 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-xl text-white font-sans text-xs focus:outline-none"
          >
            <option value="all">All Channels</option>
            <option value="staff">Staff Entry</option>
            <option value="phone">Phone Call</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="walk_in">Walk-In</option>
            <option value="website">Direct Web</option>
            <option value="q_restobar">Q RESTOBAR</option>
            <option value="hotel_concierge">Hotel Concierge</option>
            <option value="google">Google Reserve</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Min Party Size Filter */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
            Min Party Size
          </label>
          <select
            value={filters.minPartySize || ""}
            onChange={(e) => updateFilter("minPartySize", e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 bg-zinc-950 border border-white/15 focus:border-purple-500 rounded-xl text-white font-sans text-xs focus:outline-none"
          >
            <option value="">Any Size</option>
            <option value="2">2+ Guests</option>
            <option value="4">4+ Guests</option>
            <option value="6">6+ Guests (Large Party)</option>
            <option value="8">8+ Guests (VIP/PDR)</option>
          </select>
        </div>

      </div>
    </div>
  );
}
