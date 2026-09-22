import React from "react";
import { 
  X, 
  UtensilsCrossed, 
  Clock, 
  Users, 
  Plus, 
  CheckCircle2, 
  Flame, 
  Utensils, 
  AlertTriangle, 
  ChefHat, 
  Wine, 
  Cake,
  CheckCircle,
  XCircle,
  Layers
} from "lucide-react";
import { useOrders } from "../context/OrderContext";
import { OrderItem, CourseType, ServiceStation, OrderItemStatus } from "../types";

export function OrderDetailDrawer() {
  const { 
    selectedOrder, 
    isOrderDetailDrawerOpen, 
    closeOrderDetail, 
    startFastOrdering, 
    completeOrder, 
    cancelOrder,
    startPreparing,
    markItemReady,
    markItemServed,
    cancelItem
  } = useOrders();

  if (!isOrderDetailDrawerOpen || !selectedOrder) return null;

  const calculateElapsedMinutes = (openedAt: string): number => {
    const diffMs = Date.now() - new Date(openedAt).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const elapsed = calculateElapsedMinutes(selectedOrder.opened_at);
  const nonCancelled = selectedOrder.items.filter((i) => i.status !== "cancelled");
  const allServed = nonCancelled.length > 0 && nonCancelled.every((i) => i.status === "served");
  const totalSubtotal = nonCancelled.reduce((acc, i) => acc + i.unit_price * i.quantity, 0);

  // Group items by course
  const courses: CourseType[] = ["drinks", "starter", "main", "side", "dessert", "other"];

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

  const getItemStatusBadge = (status: OrderItemStatus) => {
    switch (status) {
      case "ready":
        return {
          label: "READY",
          bg: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400",
        };
      case "preparing":
        return {
          label: "COOKING",
          bg: "bg-amber-500/15 border-amber-500/40 text-amber-400",
        };
      case "served":
        return {
          label: "SERVED",
          bg: "bg-blue-500/15 border-blue-500/40 text-blue-300",
        };
      case "cancelled":
        return {
          label: "CANCELLED",
          bg: "bg-rose-900/30 border-rose-800 text-rose-400",
        };
      case "pending":
      case "draft":
        return {
          label: "PENDING",
          bg: "bg-purple-500/15 border-purple-500/30 text-purple-300",
        };
      case "sent":
      case "accepted":
      default:
        return {
          label: "SENT",
          bg: "bg-zinc-800 border-zinc-700 text-zinc-300",
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-150">
      <div 
        onClick={closeOrderDetail}
        className="absolute inset-0 bg-black/80 backdrop-blur-xs"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-zinc-900 border-l border-white/10 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 border-b border-white/10 bg-zinc-950/60 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center font-mono font-black text-sm">
                {selectedOrder.table_number || "W/I"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black text-white">
                    {selectedOrder.order_number}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-mono font-bold uppercase">
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="text-zinc-400 font-sans text-xs mt-0.5">
                  {selectedOrder.guest_name || "Seated Guests"} • Server: {selectedOrder.assigned_staff_name || "David K."}
                </div>
              </div>
            </div>

            <button
              onClick={closeOrderDetail}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Timing & Subtotal Bar */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-zinc-950 p-3 rounded-xl border border-white/5">
                <div className="text-zinc-500 text-[10px] uppercase">Service Elapsed</div>
                <div className="font-bold text-white mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  {elapsed} min
                </div>
              </div>

              <div className="bg-zinc-950 p-3 rounded-xl border border-white/5">
                <div className="text-zinc-500 text-[10px] uppercase">Subtotal Preview</div>
                <div className="font-black text-amber-400 mt-1">
                  RM {totalSubtotal.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedOrder.notes && (
              <div className="p-3 bg-zinc-950/60 border border-white/5 rounded-xl text-xs font-sans text-zinc-300 italic">
                "{selectedOrder.notes}"
              </div>
            )}

            {/* Course Breakdown */}
            <div className="space-y-4">
              {courses.map((courseName) => {
                const courseItems = selectedOrder.items.filter((i) => i.course === courseName);
                if (courseItems.length === 0) return null;

                return (
                  <div key={courseName} className="space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-white/5">
                      <span className="font-mono text-xs font-bold text-purple-400 uppercase tracking-wider">
                        {courseName} Course ({courseItems.length})
                      </span>
                    </div>

                    <div className="space-y-2">
                      {courseItems.map((item) => {
                        const statusBadge = getItemStatusBadge(item.status);

                        return (
                          <div
                            key={item.id}
                            className="bg-zinc-950/80 border border-white/5 rounded-xl p-3 space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-sans text-sm font-bold text-white flex items-center gap-2">
                                  <span className="text-purple-400 font-mono">{item.quantity}x</span>
                                  {item.item_name}
                                </div>
                                <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2 mt-0.5">
                                  {item.seat_number && <span>Seat {item.seat_number}</span>}
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    {renderStationIcon(item.destination_station)}
                                    <span className="capitalize">{item.destination_station}</span>
                                  </span>
                                </div>
                              </div>

                              <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold uppercase ${statusBadge.bg}`}>
                                {statusBadge.label}
                              </span>
                            </div>

                            {/* Modifiers & Doneness */}
                            {(item.cooking_preference || (item.modifiers && item.modifiers.length > 0)) && (
                              <div className="flex flex-wrap gap-1 text-[10px] font-mono text-zinc-300">
                                {item.cooking_preference && (
                                  <span className="text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                                    {item.cooking_preference}
                                  </span>
                                )}
                                {item.modifiers?.map((m) => (
                                  <span key={m} className="bg-zinc-800 px-1.5 py-0.5 rounded">
                                    {m}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Allergy Alert */}
                            {item.allergy_notes && item.allergy_notes.length > 0 && (
                              <div className="text-[10px] font-mono font-bold text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-rose-400" />
                                <span>ALLERGY: {item.allergy_notes.join(", ")}</span>
                              </div>
                            )}

                            {/* Item Actions */}
                            <div className="pt-2 border-t border-white/5 flex items-center justify-end gap-1.5">
                              {item.status === "sent" && (
                                <button
                                  onClick={() => startPreparing(selectedOrder.id, item.id)}
                                  className="px-2.5 py-1 rounded bg-amber-400/15 text-amber-300 hover:bg-amber-400/25 border border-amber-400/30 text-[10px] font-mono font-bold uppercase transition-colors"
                                >
                                  Start Cooking
                                </button>
                              )}

                              {item.status === "preparing" && (
                                <button
                                  onClick={() => markItemReady(selectedOrder.id, item.id)}
                                  className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase transition-colors"
                                >
                                  Mark Ready
                                </button>
                              )}

                              {item.status === "ready" && (
                                <button
                                  onClick={() => markItemServed(selectedOrder.id, item.id)}
                                  className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-[10px] font-mono font-black uppercase tracking-wider transition-all"
                                >
                                  Mark Served
                                </button>
                              )}

                              {item.status !== "served" && item.status !== "cancelled" && (
                                <button
                                  onClick={() => cancelItem(selectedOrder.id, item.id, "Removed by waiter")}
                                  className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                                  title="Cancel Item"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-white/10 bg-zinc-950/80 space-y-2.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  closeOrderDetail();
                  startFastOrdering(selectedOrder);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-mono text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <Plus className="w-4 h-4" />
                ADD MORE ITEMS
              </button>

              <button
                disabled={selectedOrder.status === "completed"}
                onClick={() => completeOrder(selectedOrder.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40"
              >
                <CheckCircle className="w-4 h-4" />
                COMPLETE SERVICE
              </button>
            </div>

            {selectedOrder.status !== "completed" && selectedOrder.status !== "cancelled" && (
              <button
                onClick={() => cancelOrder(selectedOrder.id, "Cancelled by staff")}
                className="w-full py-2 text-center text-zinc-500 hover:text-rose-400 font-mono text-[11px] font-bold uppercase transition-colors"
              >
                CANCEL ENTIRE ORDER
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
