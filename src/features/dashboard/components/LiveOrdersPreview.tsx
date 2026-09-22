import React from "react";
import { 
  UtensilsCrossed, 
  Wine, 
  Cake, 
  Clock, 
  CheckCircle2, 
  AlertTriangle 
} from "lucide-react";
import { useDashboard } from "../context/DashboardContext";
import { LiveOrderItem, OrderDestination } from "../types";

export function LiveOrdersPreview() {
  const { data, markOrderReady } = useDashboard();
  const orders = data?.liveOrders || [];

  const getDestinationIcon = (dest: OrderDestination) => {
    switch (dest) {
      case "Cocktail Bar":
        return <Wine className="w-3.5 h-3.5 text-purple-400" />;
      case "Pastry / Dessert":
        return <Cake className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <UtensilsCrossed className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 font-mono text-xs">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4 text-purple-400" />
          <span className="font-bold text-white uppercase tracking-wider text-sm">
            KITCHEN & BAR ORDERS ({orders.length})
          </span>
        </div>
        <span className="text-[10px] text-zinc-400">
          REAL-TIME PACING
        </span>
      </div>

      {/* Orders List */}
      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {orders.map((order: LiveOrderItem) => {
          const isReady = order.status === "ready";
          const isDelayed = order.status === "delayed" || order.isUrgent;

          return (
            <div
              key={order.id}
              className={`p-3.5 rounded-xl border transition-all ${
                isReady
                  ? "bg-emerald-950/20 border-emerald-500/30"
                  : isDelayed
                  ? "bg-rose-950/20 border-rose-500/30"
                  : "bg-zinc-950 border-white/10"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                
                {/* Details */}
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap font-mono">
                    <span className="font-black text-white text-xs">{order.orderNumber}</span>
                    <span className="font-bold text-amber-400 text-xs px-2 py-0.5 rounded bg-zinc-800 border border-white/10">
                      Table {order.tableNumber}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 border border-white/10 text-[10px] text-zinc-300">
                      {getDestinationIcon(order.destination)}
                      {order.destination}
                    </span>
                    <span className="text-zinc-500 text-[11px]">Server: {order.serverName}</span>
                  </div>

                  <p className="text-xs text-zinc-300 font-sans font-medium pt-0.5">
                    {order.summary}
                  </p>

                  <div className="flex items-center gap-2 text-xs font-mono pt-1">
                    <span className="text-zinc-500 text-[11px]">In Prep:</span>
                    <span className={`font-bold flex items-center gap-1 ${
                      isDelayed ? "text-rose-400" : isReady ? "text-emerald-400" : "text-zinc-300"
                    }`}>
                      <Clock className="w-3 h-3" />
                      {order.elapsedMinutes} mins
                    </span>
                    {isDelayed && (
                      <span className="text-[10px] text-rose-400 font-bold uppercase flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" />
                        EXPEDITE REQUIRED
                      </span>
                    )}
                  </div>
                </div>

                {/* Status / Action */}
                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0 font-mono text-xs">
                  {isReady ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold rounded-lg text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ready for Runner</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => markOrderReady(order.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-white/15 rounded-lg text-xs transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Mark Ready</span>
                    </button>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
