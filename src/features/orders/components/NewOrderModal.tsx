import React, { useState, useEffect } from "react";
import { 
  X, 
  UtensilsCrossed, 
  Users, 
  MapPin, 
  Sparkles, 
  AlertCircle 
} from "lucide-react";
import { useOrders } from "../context/OrderContext";
import { RestaurantTable } from "../../floor/types";
import { floorService } from "../../floor/services/floorService";

export function NewOrderModal() {
  const { 
    isNewOrderModalOpen, 
    closeNewOrderModal, 
    openOrder, 
    orders 
  } = useOrders();

  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [guestName, setGuestName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadTables = async () => {
      try {
        setIsLoading(true);
        const allTables = await floorService.listTables();
        if (isMounted) {
          // Find seated/dining tables or all active tables
          const availableForOrder = allTables.filter((t) => t.is_active && t.status !== "blocked");
          setTables(availableForOrder);
          if (availableForOrder.length > 0) {
            setSelectedTableId(availableForOrder[0].id);
            setGuestName(availableForOrder[0].current_session?.guestName || "");
          }
        }
      } catch (err) {
        console.error("Failed to load tables:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (isNewOrderModalOpen) {
      loadTables();
    }
    return () => {
      isMounted = false;
    };
  }, [isNewOrderModalOpen]);

  const handleTableChange = (tableId: string) => {
    setSelectedTableId(tableId);
    const table = tables.find((t) => t.id === tableId);
    if (table?.current_session?.guestName) {
      setGuestName(table.current_session.guestName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTableId) {
      setErrorMsg("Please select a table");
      return;
    }

    try {
      setErrorMsg(null);
      await openOrder({
        table_id: selectedTableId,
        guest_name: guestName.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setNotes("");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to open order");
    }
  };

  if (!isNewOrderModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <UtensilsCrossed className="w-5 h-5 text-purple-400" />
            <h2 className="font-mono text-base font-black text-white uppercase tracking-wider">
              Open Table Order
            </h2>
          </div>
          <button
            onClick={closeNewOrderModal}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-zinc-400 font-mono text-xs uppercase mb-1.5">
              Select Dining Table *
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {tables.map((table) => {
                const isSelected = selectedTableId === table.id;
                const isSeated = table.status === "seated" || table.status === "ordering" || table.status === "dining";
                const hasActiveOrder = orders.some(
                  (o) => o.table_id === table.id && o.status !== "completed" && o.status !== "cancelled"
                );

                return (
                  <div
                    key={table.id}
                    onClick={() => {
                      if (!hasActiveOrder) {
                        handleTableChange(table.id);
                      }
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      hasActiveOrder
                        ? "opacity-50 bg-zinc-900 border-white/5 cursor-not-allowed text-zinc-500"
                        : isSelected
                        ? "bg-purple-500/20 border-purple-500 text-white ring-1 ring-purple-500 cursor-pointer"
                        : "bg-zinc-800/70 border-white/5 text-zinc-300 hover:bg-zinc-800 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-black ${
                        isSelected ? "bg-purple-500 text-white" : "bg-zinc-700 text-zinc-200"
                      }`}>
                        {table.table_number}
                      </div>
                      <div>
                        <div className="font-mono text-xs font-bold">
                          {table.current_session?.guestName || `Table ${table.table_number}`}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-400">
                          {table.capacity} Seats • {table.seating_area_name || "Floor"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {hasActiveOrder && (
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          ORDER ACTIVE
                        </span>
                      )}
                      <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                        isSeated ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-zinc-700 text-zinc-300"
                      }`}>
                        {table.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 font-mono text-xs uppercase mb-1">
              Guest / Party Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Jason Lee"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full bg-zinc-800 border border-white/10 text-white text-xs font-sans rounded-xl p-2.5 focus:outline-none focus:border-purple-400"
            />
          </div>

          <div>
            <label className="block text-zinc-400 font-mono text-xs uppercase mb-1">
              Order Notes & Table Instructions
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Stagger starters, bring wine with mains..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-800 border border-white/10 text-white text-xs font-sans rounded-xl p-2.5 focus:outline-none focus:border-purple-400"
            />
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeNewOrderModal}
              className="px-4 py-2 rounded-xl font-mono text-xs font-bold text-zinc-400 hover:text-white"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-mono text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
            >
              OPEN ORDER & TAKE ITEMS
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
