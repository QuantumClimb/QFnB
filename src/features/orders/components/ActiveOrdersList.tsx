import React from "react";
import { 
  Utensils, 
  Clock, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  ChefHat, 
  Wine, 
  Users, 
  ChevronRight,
  Flame,
  Layers
} from "lucide-react";
import { useOrders } from "../context/OrderContext";
import { Order, OrderStatus } from "../types";

export function ActiveOrdersList() {
  const { 
    orders, 
    isLoading, 
    openOrderDetail, 
    startFastOrdering, 
    openNewOrderModal,
    markItemServed
  } = useOrders();

  const calculateElapsedMinutes = (openedAt: string): number => {
    const diffMs = Date.now() - new Date(openedAt).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "ready":
        return {
          label: "ITEMS READY",
          bg: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400",
          dot: "bg-emerald-400 animate-pulse",
        };
      case "in_progress":
      case "sent":
        return {
          label: "IN PREP",
          bg: "bg-amber-500/15 border-amber-500/40 text-amber-400",
          dot: "bg-amber-400 animate-spin",
        };
      case "partially_served":
        return {
          label: "PARTIALLY SERVED",
          bg: "bg-cyan-500/15 border-cyan-500/40 text-cyan-300",
          dot: "bg-cyan-400",
        };
      case "served":
        return {
          label: "ALL SERVED",
          bg: "bg-blue-500/15 border-blue-500/40 text-blue-300",
          dot: "bg-blue-400",
        };
      case "completed":
        return {
          label: "COMPLETED",
          bg: "bg-zinc-700/40 border-zinc-600 text-zinc-400",
          dot: "bg-zinc-400",
        };
      case "open":
      default:
        return {
          label: "OPEN (PENDING)",
          bg: "bg-purple-500/15 border-purple-500/40 text-purple-300",
          dot: "bg-purple-400",
        };
    }
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-12 text-center">
        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest">
          Loading live orders...
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-12 text-center space-y-3">
        <Layers className="w-10 h-10 text-zinc-600 mx-auto" />
        <div className="font-mono text-sm font-bold text-white uppercase tracking-wider">
          No Orders Matching Filters
        </div>
        <p className="text-zinc-400 font-sans text-xs max-w-sm mx-auto">
          Create a new table order using the <span className="text-purple-400 font-mono font-bold">+ NEW TABLE ORDER</span> button above.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {orders.map((order) => {
        const elapsed = calculateElapsedMinutes(order.opened_at);
        const isDelayed = elapsed > 25 && (order.status === "in_progress" || order.status === "sent");
        const statusBadge = getOrderStatusBadge(order.status);

        // Calculate item breakdowns
        const readyItems = order.items.filter((i) => i.status === "ready");
        const preparingItems = order.items.filter((i) => i.status === "preparing");
        const servedItems = order.items.filter((i) => i.status === "served");
        const allAllergies = Array.from(
          new Set(order.items.flatMap((i) => i.allergy_notes || []))
        );

        return (
          <div
            key={order.id}
            onClick={() => openOrderDetail(order)}
            className={`group bg-zinc-900/95 hover:bg-zinc-850 border rounded-xl p-4.5 transition-all duration-150 cursor-pointer shadow-md hover:shadow-xl flex flex-col justify-between ${
              readyItems.length > 0
                ? "border-emerald-500/40 hover:border-emerald-400/70 bg-emerald-950/10"
                : isDelayed
                ? "border-rose-500/40 hover:border-rose-400/70"
                : "border-white/10 hover:border-white/20"
            }`}
          >
            <div>
              {/* Top Header: Order Number + Table Badge + Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center font-mono text-xs font-black text-amber-400">
                    {order.table_number || "W/I"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-white">
                        {order.order_number}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold tracking-wider ${statusBadge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                        {statusBadge.label}
                      </span>
                    </div>
                    <div className="text-zinc-400 font-sans text-xs font-semibold mt-0.5">
                      {order.guest_name || "Seated Guests"}
                    </div>
                  </div>
                </div>

                {/* Elapsed Time Indicator */}
                <div className="text-right">
                  <div className={`font-mono text-xs font-bold flex items-center gap-1 ${
                    isDelayed ? "text-rose-400" : "text-zinc-300"
                  }`}>
                    <Clock className="w-3 h-3 text-purple-400" />
                    {elapsed} min
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500">
                    {order.items.length} items
                  </div>
                </div>
              </div>

              {/* Allergy Safety Callout (if any) */}
              {allAllergies.length > 0 && (
                <div className="mt-3 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="font-mono text-[10px] font-bold text-rose-300 uppercase tracking-wide">
                    ALLERGY ALERT: {allAllergies.join(", ")}
                  </span>
                </div>
              )}

              {/* Items List Preview */}
              <div className="mt-3 space-y-1.5 border-t border-white/5 pt-2.5">
                {order.items.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs font-mono text-zinc-300"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-purple-400 font-bold">{item.quantity}x</span>
                      <span className="truncate">{item.item_name}</span>
                      {item.cooking_preference && (
                        <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 rounded border border-amber-400/20">
                          {item.cooking_preference}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${
                      item.status === "ready"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : item.status === "preparing"
                        ? "bg-amber-500/20 text-amber-400"
                        : item.status === "served"
                        ? "text-zinc-500 line-through"
                        : "text-zinc-400"
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <div className="text-[10px] font-mono text-zinc-500 pt-0.5">
                    +{order.items.length - 3} more items on ticket...
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div 
              className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-[10px] font-mono text-zinc-500">
                Staff: {order.assigned_staff_name || "Floor Server"}
              </div>

              <div className="flex items-center gap-2">
                {readyItems.length > 0 && (
                  <button
                    onClick={() => {
                      readyItems.forEach((i) => markItemServed(order.id, i.id));
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono text-[11px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    SERVE ({readyItems.length})
                  </button>
                )}

                <button
                  onClick={() => startFastOrdering(order)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 font-mono text-[11px] font-bold tracking-wider transition-colors"
                >
                  <Plus className="w-3 h-3 text-purple-400" />
                  ADD ITEMS
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
