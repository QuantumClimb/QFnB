import React from "react";
import { 
  UtensilsCrossed, 
  Flame, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Plus, 
  ChefHat, 
  Wine, 
  Sparkles,
  Users
} from "lucide-react";
import { useOrders } from "../context/OrderContext";
import { OrderViewMode } from "../types";

const VIEW_MODES: { id: OrderViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "ACTIVE", label: "ACTIVE ORDERS", icon: Layers },
  { id: "READY", label: "READY FOR SERVICE", icon: CheckCircle2 },
  { id: "SERVICE_BOARD", label: "SERVICE EXPEDITE", icon: ChefHat },
  { id: "MY_TABLES", label: "MY TABLES", icon: Users },
  { id: "ALL", label: "ALL TICKETS", icon: UtensilsCrossed },
];

export function OrdersHeader() {
  const { summary, viewMode, setViewMode, openNewOrderModal } = useOrders();

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-900 border border-white/10 p-5 rounded-xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-purple-400 uppercase tracking-widest text-[11px] font-mono font-semibold">
              SERVICE PACING & EXPEDITE
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-mono font-bold">
              LIVE SERVICE
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase font-mono tracking-tight mt-1">
            ORDERS
          </h1>
          <p className="text-zinc-400 font-sans text-xs md:text-sm mt-0.5">
            Real-time table order tickets, course pacing, station expediting (Kitchen/Bar), and service delivery.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={openNewOrderModal}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white px-5 py-3 rounded-lg font-mono text-xs md:text-sm font-black uppercase tracking-wider shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            NEW TABLE ORDER
          </button>
        </div>
      </div>

      {/* 5 Key Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Active Orders */}
        <div className="bg-zinc-900/90 border border-white/10 p-3.5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono uppercase tracking-wider">
            <span>Active Orders</span>
            <Layers className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white font-mono">{summary?.activeOrdersCount ?? 0}</span>
            <span className="text-[10px] text-zinc-500 font-mono">tickets</span>
          </div>
        </div>

        {/* Items Preparing */}
        <div className="bg-zinc-900/90 border border-white/10 p-3.5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono uppercase tracking-wider">
            <span>Items Cooking</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-400 font-mono">{summary?.itemsPreparingCount ?? 0}</span>
            <span className="text-[10px] text-zinc-500 font-mono">dishes</span>
          </div>
        </div>

        {/* Items Ready */}
        <div className="bg-zinc-900/90 border border-white/10 p-3.5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono uppercase tracking-wider">
            <span>Ready On Pass</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-400 font-mono">{summary?.itemsReadyCount ?? 0}</span>
            <span className="text-[10px] text-zinc-500 font-mono">to serve</span>
          </div>
        </div>

        {/* Average Prep Time */}
        <div className="bg-zinc-900/90 border border-white/10 p-3.5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono uppercase tracking-wider">
            <span>Average Prep</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white font-mono">{summary?.averagePrepTimeMinutes ?? 14}</span>
            <span className="text-[10px] text-zinc-500 font-mono">min</span>
          </div>
        </div>

        {/* Tables Waiting */}
        <div className="bg-zinc-900/90 border border-white/10 p-3.5 rounded-xl flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono uppercase tracking-wider">
            <span>Tables Waiting</span>
            <UtensilsCrossed className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-rose-400 font-mono">{summary?.tablesWaitingCount ?? 0}</span>
            <span className="text-[10px] text-zinc-500 font-mono">tables</span>
          </div>
        </div>
      </div>

      {/* View Mode Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-white/10 p-1.5 rounded-xl overflow-x-auto scrollbar-none">
        {VIEW_MODES.map((mode) => {
          const isActive = viewMode === mode.id;
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-purple-500 text-white shadow-md shadow-purple-500/20"
                  : "bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {mode.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
