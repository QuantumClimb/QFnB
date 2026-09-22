import React from "react";
import { 
  Flame, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ChefHat, 
  Wine, 
  Cake, 
  Utensils, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useOrders } from "../context/OrderContext";
import { OrderItem, ServiceStation } from "../types";

export function ServiceBoardView() {
  const { 
    orders, 
    stationFilter, 
    startPreparing, 
    markItemReady, 
    markItemServed,
    openOrderDetail
  } = useOrders();

  const calculateElapsedMinutes = (timeStr?: string | null): number => {
    if (!timeStr) return 0;
    const diffMs = Date.now() - new Date(timeStr).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  // Flatten all items across active orders
  const allItems: { item: OrderItem; orderId: string; tableNumber: string; orderNumber: string; guestName: string }[] = [];
  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (stationFilter === "all" || item.destination_station === stationFilter) {
        allItems.push({
          item,
          orderId: order.id,
          tableNumber: order.table_number || "W/I",
          orderNumber: order.order_number,
          guestName: order.guest_name || "Guest",
        });
      }
    });
  });

  const sentItems = allItems.filter(({ item }) => item.status === "sent" || item.status === "accepted");
  const preparingItems = allItems.filter(({ item }) => item.status === "preparing");
  const readyItems = allItems.filter(({ item }) => item.status === "ready");
  const servedItems = allItems.filter(({ item }) => item.status === "served").slice(0, 10);

  const renderStationIcon = (station: ServiceStation) => {
    switch (station) {
      case "bar":
        return <Wine className="w-3.5 h-3.5 text-cyan-400" />;
      case "dessert":
        return <Cake className="w-3.5 h-3.5 text-pink-400" />;
      case "kitchen":
      default:
        return <ChefHat className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const renderTicketCard = (
    entry: { item: OrderItem; orderId: string; tableNumber: string; orderNumber: string; guestName: string },
    stage: "sent" | "preparing" | "ready" | "served"
  ) => {
    const { item, orderId, tableNumber, orderNumber, guestName } = entry;
    const elapsed = stage === "preparing" ? calculateElapsedMinutes(item.started_at) : calculateElapsedMinutes(item.sent_at);
    const isDelayed = stage === "preparing" && elapsed > 15;

    return (
      <div
        key={item.id}
        className={`bg-zinc-900 border rounded-xl p-3.5 space-y-2.5 shadow-md transition-all ${
          stage === "ready"
            ? "border-emerald-500/40 bg-emerald-950/10"
            : isDelayed
            ? "border-rose-500/40"
            : "border-white/10"
        }`}
      >
        {/* Ticket Header: Table + Order # + Station + Timer */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center font-mono text-xs font-black text-amber-400">
              {tableNumber}
            </span>
            <div>
              <div className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                <span>{orderNumber}</span>
                {item.seat_number && (
                  <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.2 rounded">
                    Seat {item.seat_number}
                  </span>
                )}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 truncate max-w-[120px]">
                {guestName}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs">
            {renderStationIcon(item.destination_station)}
            <span className={`font-bold flex items-center gap-1 ${
              isDelayed ? "text-rose-400" : "text-zinc-300"
            }`}>
              <Clock className="w-3 h-3 text-zinc-500" />
              {elapsed}m
            </span>
          </div>
        </div>

        {/* Item Name + Quantity */}
        <div className="pt-1.5 border-t border-white/5">
          <div className="flex items-start justify-between gap-2">
            <span className="font-sans text-sm font-bold text-white leading-tight">
              <strong className="text-purple-400 font-mono mr-1.5">{item.quantity}x</strong>
              {item.item_name}
            </span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 shrink-0">
              {item.course}
            </span>
          </div>

          {/* Modifiers & Doneness */}
          {(item.cooking_preference || (item.modifiers && item.modifiers.length > 0)) && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {item.cooking_preference && (
                <span className="text-[10px] font-mono text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30">
                  {item.cooking_preference}
                </span>
              )}
              {item.modifiers?.map((mod) => (
                <span key={mod} className="text-[10px] font-mono text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded border border-white/5">
                  {mod}
                </span>
              ))}
            </div>
          )}

          {/* Allergy Notes */}
          {item.allergy_notes && item.allergy_notes.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1 text-[10px] font-mono font-bold text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded">
              <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
              <span>ALLERGY: {item.allergy_notes.join(", ")}</span>
            </div>
          )}

          {/* Special Instructions */}
          {item.special_instructions && (
            <p className="mt-1 text-[11px] font-sans text-zinc-400 italic">
              "{item.special_instructions}"
            </p>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-end">
          {stage === "sent" && (
            <button
              onClick={() => startPreparing(orderId, item.id)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-mono text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5" />
              START COOKING
            </button>
          )}

          {stage === "preparing" && (
            <button
              onClick={() => markItemReady(orderId, item.id)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              MARK READY (PASS)
            </button>
          )}

          {stage === "ready" && (
            <button
              onClick={() => markItemServed(orderId, item.id)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
            >
              <Utensils className="w-3.5 h-3.5" />
              DELIVER / SERVED
            </button>
          )}

          {stage === "served" && (
            <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Served {calculateElapsedMinutes(item.served_at)}m ago
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
      {/* Column 1: SENT / NEW TICKETS */}
      <div className="space-y-3">
        <div className="bg-zinc-900 border border-white/10 p-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
            <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              NEW / SENT ({sentItems.length})
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase">Incoming</span>
        </div>

        <div className="space-y-3">
          {sentItems.length === 0 ? (
            <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-xl text-center text-zinc-500 font-mono text-xs">
              No new tickets
            </div>
          ) : (
            sentItems.map((entry) => renderTicketCard(entry, "sent"))
          )}
        </div>
      </div>

      {/* Column 2: PREPARING / COOKING */}
      <div className="space-y-3">
        <div className="bg-zinc-900 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h3 className="font-mono text-xs font-bold text-amber-300 uppercase tracking-wider">
              PREPARING ({preparingItems.length})
            </h3>
          </div>
          <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">On Fire</span>
        </div>

        <div className="space-y-3">
          {preparingItems.length === 0 ? (
            <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-xl text-center text-zinc-500 font-mono text-xs">
              No items cooking
            </div>
          ) : (
            preparingItems.map((entry) => renderTicketCard(entry, "preparing"))
          )}
        </div>
      </div>

      {/* Column 3: READY ON THE PASS */}
      <div className="space-y-3">
        <div className="bg-zinc-900 border border-emerald-500/40 p-3 rounded-xl flex items-center justify-between bg-emerald-950/20">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h3 className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider">
              READY ON PASS ({readyItems.length})
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Pickup</span>
        </div>

        <div className="space-y-3">
          {readyItems.length === 0 ? (
            <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-xl text-center text-zinc-500 font-mono text-xs">
              No items on pass
            </div>
          ) : (
            readyItems.map((entry) => renderTicketCard(entry, "ready"))
          )}
        </div>
      </div>

      {/* Column 4: SERVED */}
      <div className="space-y-3">
        <div className="bg-zinc-900 border border-white/10 p-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-500" />
            <h3 className="font-mono text-xs font-bold text-zinc-400 uppercase tracking-wider">
              RECENTLY SERVED
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase">Delivered</span>
        </div>

        <div className="space-y-3">
          {servedItems.length === 0 ? (
            <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-xl text-center text-zinc-500 font-mono text-xs">
              No served history
            </div>
          ) : (
            servedItems.map((entry) => renderTicketCard(entry, "served"))
          )}
        </div>
      </div>
    </div>
  );
}
