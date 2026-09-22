import React from "react";
import { Sparkles, Plus, Tag, Gift, Layers, CalendarCheck } from "lucide-react";
import { useOffers } from "../context/OffersContext";
import { OffersTab } from "../types";

export function OffersHeader() {
  const {
    activeTab,
    setActiveTab,
    openCreateExpModal,
    openCreateOfferModal,
    openCreateAddonModal,
    openAttachExpModal,
  } = useOffers();

  const tabs: { id: OffersTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "EXPERIENCES", label: "EXPERIENCES", icon: Sparkles },
    { id: "OFFERS", label: "OFFERS", icon: Tag },
    { id: "ADD_ONS", label: "ADD-ONS", icon: Gift },
    { id: "RESERVATION_BOOKINGS", label: "RESERVATION BOOKINGS", icon: CalendarCheck },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-zinc-900 border border-white/10 p-5 md:p-6 rounded-lg">
        <div>
          <div className="flex items-center gap-2 text-purple-400 uppercase tracking-widest text-[10px] font-mono mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>HOSPITALITY PACKAGES & CURATION</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase font-mono tracking-tight">
            OFFERS & EXPERIENCES
          </h1>
          <p className="text-zinc-400 font-sans text-xs md:text-sm mt-1">
            Design tasting menus, milestone celebrations, add-on enhancements, and link them to guest reservations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "EXPERIENCES" && (
            <>
              <button
                onClick={() => openAttachExpModal()}
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 rounded font-mono text-xs font-semibold transition"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>ATTACH TO BOOKING</span>
              </button>
              <button
                onClick={openCreateExpModal}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-mono text-xs font-bold transition shadow-lg shadow-purple-900/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>NEW EXPERIENCE</span>
              </button>
            </>
          )}

          {activeTab === "OFFERS" && (
            <button
              onClick={openCreateOfferModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-mono text-xs font-bold transition shadow-lg shadow-purple-900/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>NEW OFFER</span>
            </button>
          )}

          {activeTab === "ADD_ONS" && (
            <button
              onClick={openCreateAddonModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-mono text-xs font-bold transition shadow-lg shadow-purple-900/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>NEW ADD-ON</span>
            </button>
          )}

          {activeTab === "RESERVATION_BOOKINGS" && (
            <button
              onClick={() => openAttachExpModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-mono text-xs font-bold transition shadow-lg shadow-purple-900/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ATTACH EXPERIENCE</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-zinc-900/80 border border-white/10 p-1 rounded-lg overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded font-mono text-xs font-bold whitespace-nowrap transition ${
                isActive
                  ? "bg-purple-600 text-white shadow"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
