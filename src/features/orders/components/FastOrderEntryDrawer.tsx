import React, { useState } from "react";
import { 
  X, 
  UtensilsCrossed, 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  Users, 
  Clock, 
  AlertTriangle, 
  Check, 
  Flame, 
  Wine, 
  Coffee, 
  Cake, 
  Salad, 
  Fish,
  Utensils,
  Layers,
  ChevronRight
} from "lucide-react";
import { useOrders } from "../context/OrderContext";
import { MenuItem, CourseType, ServiceStation } from "../types";

const ALLERGY_PRESETS = ["PEANUT", "SHELLFISH", "GLUTEN", "DAIRY", "EGG", "NUTS", "PORK-FREE"];
const SEAT_PRESETS = [1, 2, 3, 4, 5, 6, 7, 8];

export function FastOrderEntryDrawer() {
  const { 
    activeOrderingOrder, 
    isFastOrderDrawerOpen, 
    closeFastOrdering, 
    menuItems, 
    categories, 
    addItem, 
    removeDraftItem, 
    sendOrder 
  } = useOrders();

  const [selectedCategory, setSelectedCategory] = useState<string>("starters");
  const [activeItemForCustomization, setActiveItemForCustomization] = useState<MenuItem | null>(null);

  // Customization state
  const [selectedSeat, setSelectedSeat] = useState<number | undefined>(undefined);
  const [selectedDoneness, setSelectedDoneness] = useState<string>("");
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [isSending, setIsSending] = useState<boolean>(false);

  if (!isFastOrderDrawerOpen || !activeOrderingOrder) return null;

  const currentCategoryItems = menuItems.filter(
    (i) => selectedCategory === "all" || i.category === selectedCategory
  );

  const handleOpenCustomization = (menuItem: MenuItem) => {
    setActiveItemForCustomization(menuItem);
    setSelectedSeat(undefined);
    setSelectedDoneness(menuItem.modifier_groups?.find((g) => g.id.includes("doneness"))?.options[1]?.name || "");
    setSelectedModifiers([]);
    setSelectedAllergies([]);
    setSpecialInstructions("");
    setQuantity(1);
  };

  const handleAddCustomizedItem = async () => {
    if (!activeItemForCustomization) return;

    await addItem(activeOrderingOrder.id, {
      menu_item_id: activeItemForCustomization.id,
      item_name: activeItemForCustomization.name,
      unit_price: activeItemForCustomization.unit_price,
      quantity,
      course: activeItemForCustomization.course,
      destination_station: activeItemForCustomization.default_station,
      seat_number: selectedSeat,
      modifiers: selectedModifiers.length > 0 ? selectedModifiers : undefined,
      cooking_preference: selectedDoneness || undefined,
      allergy_notes: selectedAllergies.length > 0 ? selectedAllergies : undefined,
      special_instructions: specialInstructions.trim() || undefined,
    });

    setActiveItemForCustomization(null);
  };

  const handleDirectQuickAdd = async (e: React.MouseEvent, menuItem: MenuItem) => {
    e.stopPropagation();
    await addItem(activeOrderingOrder.id, {
      menu_item_id: menuItem.id,
      item_name: menuItem.name,
      unit_price: menuItem.unit_price,
      quantity: 1,
      course: menuItem.course,
      destination_station: menuItem.default_station,
    });
  };

  const toggleModifier = (modName: string) => {
    setSelectedModifiers((prev) =>
      prev.includes(modName) ? prev.filter((m) => m !== modName) : [...prev, modName]
    );
  };

  const toggleAllergy = (allergy: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy]
    );
  };

  const pendingItems = activeOrderingOrder.items.filter((i) => i.status === "pending" || i.status === "draft");
  const subtotal = pendingItems.reduce((acc, i) => acc + i.unit_price * i.quantity, 0);

  const handleSend = async () => {
    try {
      setIsSending(true);
      await sendOrder(activeOrderingOrder.id);
    } catch (err) {
      console.error("Failed to send order:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-150">
      {/* Backdrop */}
      <div 
        onClick={closeFastOrdering}
        className="absolute inset-0 bg-black/80 backdrop-blur-xs"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 md:pl-10">
        <div className="w-screen max-w-6xl bg-zinc-950 border-l border-white/10 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 md:px-6 md:py-3.5 border-b border-white/10 bg-zinc-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500 text-white flex items-center justify-center font-mono font-black text-sm">
                {activeOrderingOrder.table_number || "W/I"}
              </div>
              <div>
                <div className="flex items-center gap-2 font-mono text-sm font-bold text-white">
                  <span>{activeOrderingOrder.order_number}</span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-purple-400 font-sans">{activeOrderingOrder.guest_name || "Table Order"}</span>
                </div>
                <div className="text-[11px] font-mono text-zinc-400">
                  Touch menu items to add to order basket
                </div>
              </div>
            </div>

            <button
              onClick={closeFastOrdering}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 3-Column Ordering Workspace */}
          <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* Category Navigation (2 cols) */}
            <div className="lg:col-span-3 border-r border-white/10 bg-zinc-900/60 p-3 overflow-y-auto space-y-1.5">
              <div className="text-[10px] font-mono uppercase text-zinc-500 px-2 py-1">
                Menu Categories
              </div>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl font-mono text-xs font-bold text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-purple-500 text-white shadow-md shadow-purple-500/20"
                        : "bg-zinc-850/60 text-zinc-400 hover:text-white hover:bg-zinc-800"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <ChevronRight className="w-4 h-4 opacity-60" />
                  </button>
                );
              })}
            </div>

            {/* Menu Items Grid (5 cols) */}
            <div className="lg:col-span-5 p-4 overflow-y-auto space-y-3 bg-zinc-900/20">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-zinc-400 uppercase font-bold">
                  {categories.find((c) => c.id === selectedCategory)?.name || "Dishes"}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {currentCategoryItems.length} items
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {currentCategoryItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleOpenCustomization(item)}
                    className="p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-white/5 hover:border-purple-500/40 transition-all cursor-pointer shadow-sm group flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="font-sans text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                        {item.name}
                      </div>
                      {item.description && (
                        <p className="text-zinc-400 font-sans text-xs line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 pt-1 font-mono text-xs">
                        <span className="text-purple-400 font-black">
                          RM {item.unit_price.toFixed(2)}
                        </span>
                        {item.common_allergies && item.common_allergies.length > 0 && (
                          <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                            {item.common_allergies.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDirectQuickAdd(e, item)}
                      className="p-2 rounded-lg bg-zinc-800 hover:bg-purple-500 text-zinc-300 hover:text-white transition-colors shrink-0"
                      title="Quick Add 1x"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Order Basket / Customizer Panel (4 cols) */}
            <div className="lg:col-span-4 border-l border-white/10 bg-zinc-900 flex flex-col justify-between overflow-hidden">
              {/* If an item is being customized */}
              {activeItemForCustomization ? (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-purple-400 font-bold">
                        Customize Item
                      </div>
                      <h3 className="font-sans text-sm font-bold text-white">
                        {activeItemForCustomization.name}
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveItemForCustomization(null)}
                      className="text-zinc-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Seat Number Selection */}
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1.5">
                      Assign to Guest / Seat
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedSeat(undefined)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                          selectedSeat === undefined
                            ? "bg-purple-500 text-white"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        Table Shared
                      </button>
                      {SEAT_PRESETS.map((seat) => (
                        <button
                          key={seat}
                          type="button"
                          onClick={() => setSelectedSeat(seat)}
                          className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all ${
                            selectedSeat === seat
                              ? "bg-purple-500 text-white"
                              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                          }`}
                        >
                          S{seat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cooking Temperature (if steak/grill) */}
                  {activeItemForCustomization.modifier_groups?.some((g) => g.id.includes("doneness")) && (
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1.5 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-400" />
                        Cooking Temperature
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {activeItemForCustomization.modifier_groups
                          .find((g) => g.id.includes("doneness"))
                          ?.options.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setSelectedDoneness(opt.name)}
                              className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all ${
                                selectedDoneness === opt.name
                                  ? "bg-amber-400 text-zinc-950 font-black"
                                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-750"
                              }`}
                            >
                              {opt.name}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Modifiers checkboxes */}
                  {activeItemForCustomization.modifier_groups
                    ?.filter((g) => !g.id.includes("doneness"))
                    .map((group) => (
                      <div key={group.id}>
                        <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1.5">
                          {group.name}
                        </label>
                        <div className="space-y-1.5">
                          {group.options.map((opt) => {
                            const isChecked = selectedModifiers.includes(opt.name);
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => toggleModifier(opt.name)}
                                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-mono text-left transition-all ${
                                  isChecked
                                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                                    : "bg-zinc-800 text-zinc-400 hover:text-white"
                                }`}
                              >
                                <span>{opt.name}</span>
                                {isChecked && <Check className="w-3.5 h-3.5 text-purple-400" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                  {/* Allergy Alert Badges */}
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      Allergy Safety Flags
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {ALLERGY_PRESETS.map((allergy) => {
                        const isSelected = selectedAllergies.includes(allergy);
                        return (
                          <button
                            key={allergy}
                            type="button"
                            onClick={() => toggleAllergy(allergy)}
                            className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                              isSelected
                                ? "bg-rose-500 text-white shadow"
                                : "bg-zinc-800 text-zinc-400 hover:text-white"
                            }`}
                          >
                            {allergy}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Special Instructions */}
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
                      Chef / Bar Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dressing on side, hot plate..."
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      className="w-full bg-zinc-800 border border-white/10 text-white text-xs font-sans rounded-lg p-2 focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  {/* Quantity & Confirm Add */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 bg-zinc-800 rounded-lg p-1">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="p-1 rounded hover:bg-zinc-700 text-zinc-300"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-sm font-bold text-white px-2">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => q + 1)}
                        className="p-1 rounded hover:bg-zinc-700 text-zinc-300"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddCustomizedItem}
                      className="flex-1 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-mono text-xs font-black uppercase tracking-wider transition-all"
                    >
                      ADD TO ORDER
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal Draft Basket Display */
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div className="font-mono text-xs font-bold text-white uppercase flex items-center gap-1.5">
                      <UtensilsCrossed className="w-4 h-4 text-purple-400" />
                      Pending Items ({pendingItems.length})
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400">
                      Unsent / Draft
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {pendingItems.length === 0 ? (
                      <div className="py-16 text-center text-zinc-500 font-mono text-xs space-y-2">
                        <Utensils className="w-8 h-8 mx-auto text-zinc-700" />
                        <div>Order basket is empty</div>
                        <p className="text-[11px] text-zinc-600 font-sans">
                          Select menu items from the left to build the ticket.
                        </p>
                      </div>
                    ) : (
                      pendingItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-zinc-800/80 border border-white/5 rounded-xl p-3 space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-sans text-xs font-bold text-white flex items-center gap-1.5">
                                <span className="text-purple-400 font-mono">{item.quantity}x</span>
                                {item.item_name}
                              </div>
                              {item.seat_number && (
                                <span className="text-[10px] font-mono text-zinc-400">
                                  Seat {item.seat_number}
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => removeDraftItem(activeOrderingOrder.id, item.id)}
                              className="text-zinc-500 hover:text-rose-400 p-1 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Modifiers & Doneness */}
                          {(item.cooking_preference || (item.modifiers && item.modifiers.length > 0)) && (
                            <div className="flex flex-wrap gap-1 text-[10px] font-mono text-zinc-300">
                              {item.cooking_preference && (
                                <span className="text-amber-300 bg-amber-400/10 px-1.5 rounded">
                                  {item.cooking_preference}
                                </span>
                              )}
                              {item.modifiers?.map((m) => (
                                <span key={m} className="bg-zinc-700 px-1.5 rounded">
                                  {m}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Allergy Warnings */}
                          {item.allergy_notes && item.allergy_notes.length > 0 && (
                            <div className="text-[10px] font-mono font-bold text-rose-300 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {item.allergy_notes.join(", ")}
                            </div>
                          )}

                          <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-zinc-400 border-t border-white/5">
                            <span className="capitalize">{item.course} • {item.destination_station}</span>
                            <span className="text-zinc-300 font-bold">
                              RM {(item.unit_price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Basket Footer & Send Order Action */}
                  <div className="p-4 border-t border-white/10 bg-zinc-950/80 space-y-3">
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="text-zinc-400 uppercase">Subtotal Preview</span>
                      <span className="text-white font-black text-sm">
                        RM {subtotal.toFixed(2)}
                      </span>
                    </div>

                    <button
                      disabled={pendingItems.length === 0 || isSending}
                      onClick={handleSend}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white font-mono text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-500/20 transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      {isSending ? "SENDING TO STATIONS..." : `SEND ORDER (${pendingItems.length} ITEMS)`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
