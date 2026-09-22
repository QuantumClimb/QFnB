import React, { useState, useEffect } from "react";
import { 
  Users, 
  Clock, 
  Utensils, 
  Plus, 
  CheckCircle2, 
  Flame, 
  Wine, 
  AlertTriangle,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { useOrders } from "../context/OrderContext";
import { RestaurantTable } from "../../floor/types";
import { floorService } from "../../floor/services/floorService";

export function WaiterMyTablesView() {
  const { 
    orders, 
    startFastOrdering, 
    openOrderDetail, 
    openNewOrderModal, 
    markItemServed 
  } = useOrders();

  const [seatedTables, setSeatedTables] = useState<RestaurantTable[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchSeated = async () => {
      try {
        setIsLoadingTables(true);
        const allTables = await floorService.listTables();
        if (isMounted) {
          // Find tables with active dining sessions
          setSeatedTables(
            allTables.filter((t) => t.status === "seated" || t.status === "ordering" || t.status === "dining" || t.status === "bill_requested")
          );
        }
      } catch (err) {
        console.error("Failed to load seated tables:", err);
      } finally {
        if (isMounted) setIsLoadingTables(false);
      }
    };

    fetchSeated();
    return () => {
      isMounted = false;
    };
  }, [orders]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
            My Active Service Tables
          </h2>
          <p className="text-zinc-400 font-sans text-xs">
            Monitor live table service stages, runner pickup alerts, and fast table order entry.
          </p>
        </div>
        <button
          onClick={openNewOrderModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-mono text-xs font-bold uppercase transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          OPEN TABLE
        </button>
      </div>

      {isLoadingTables && seatedTables.length === 0 ? (
        <div className="py-12 bg-zinc-900 border border-white/10 rounded-xl text-center font-mono text-xs text-zinc-400">
          Loading assigned floor tables...
        </div>
      ) : seatedTables.length === 0 ? (
        <div className="p-8 bg-zinc-900 border border-white/10 rounded-xl text-center space-y-2">
          <Users className="w-8 h-8 text-zinc-600 mx-auto" />
          <div className="font-mono text-xs font-bold text-white uppercase">
            No Seated Tables Currently Active
          </div>
          <p className="text-zinc-400 text-xs font-sans">
            Guests seated via Floor or Queue will appear here for waiter order management.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {seatedTables.map((table) => {
            const activeOrder = orders.find(
              (o) => o.table_id === table.id && o.status !== "completed" && o.status !== "cancelled"
            );

            const readyItems = activeOrder?.items.filter((i) => i.status === "ready") || [];
            const cookingItems = activeOrder?.items.filter((i) => i.status === "preparing") || [];

            return (
              <div
                key={table.id}
                className={`bg-zinc-900 border rounded-xl p-4.5 space-y-3 shadow-md transition-all ${
                  readyItems.length > 0
                    ? "border-emerald-500/40 bg-emerald-950/10"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                {/* Table Header: Table # + Seated Time + Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center font-mono text-sm font-black text-amber-400">
                      {table.table_number}
                    </div>
                    <div>
                      <h3 className="font-sans text-sm font-bold text-white">
                        {table.current_session?.guestName || "Seated Party"}
                      </h3>
                      <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5 mt-0.5">
                        <Users className="w-3 h-3 text-amber-400" />
                        <span>{table.current_session?.partySize || table.capacity} Guests</span>
                        <span>•</span>
                        <span>{table.seating_area_name || "Floor"}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase tracking-wider ${
                    table.status === "seated"
                      ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
                      : table.status === "ordering"
                      ? "bg-purple-500/15 border-purple-500/30 text-purple-300"
                      : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                  }`}>
                    {table.status}
                  </span>
                </div>

                {/* Active Order Summary */}
                {activeOrder ? (
                  <div className="bg-zinc-950/60 border border-white/5 p-3 rounded-lg space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="text-purple-400 font-bold">{activeOrder.order_number}</span>
                      <span className="text-zinc-500">{activeOrder.items.length} items ordered</span>
                    </div>

                    {/* Progress Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {readyItems.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          {readyItems.length} READY ON PASS
                        </span>
                      )}
                      {cookingItems.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px]">
                          <Flame className="w-3 h-3" />
                          {cookingItems.length} cooking
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-950/40 border border-white/5 p-3 rounded-lg text-center text-zinc-500 text-xs font-mono">
                    No order open yet for this table.
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                  {readyItems.length > 0 && activeOrder && (
                    <button
                      onClick={() => {
                        readyItems.forEach((i) => markItemServed(activeOrder.id, i.id));
                      }}
                      className="flex-1 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono text-xs font-black uppercase tracking-wider transition-all active:scale-95"
                    >
                      DELIVER ({readyItems.length})
                    </button>
                  )}

                  {activeOrder ? (
                    <button
                      onClick={() => startFastOrdering(activeOrder)}
                      className="flex-1 py-2 px-3 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 font-mono text-xs font-bold uppercase transition-colors"
                    >
                      + ADD ITEMS
                    </button>
                  ) : (
                    <button
                      onClick={() => openNewOrderModal()}
                      className="flex-1 py-2 px-3 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-mono text-xs font-black uppercase tracking-wider transition-all"
                    >
                      TAKE ORDER
                    </button>
                  )}

                  {activeOrder && (
                    <button
                      onClick={() => openOrderDetail(activeOrder)}
                      className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                      title="View Full Ticket"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
