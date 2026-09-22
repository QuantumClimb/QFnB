import React from "react";
import {
  Store, Wrench, CalendarCheck, Grid, ListOrdered,
  UtensilsCrossed, Users, Hotel, Settings,
} from "lucide-react";
import type { SettingsSection } from "../context/SettingsContext";
import { useSettings } from "../context/SettingsContext";

interface NavItem {
  id: SettingsSection;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: "restaurant",   label: "RESTAURANT",   description: "Identity, contact, locale",  icon: Store },
  { id: "service",      label: "SERVICE",       description: "Service periods & hours",    icon: Wrench },
  { id: "reservations", label: "RESERVATIONS",  description: "Booking rules & thresholds", icon: CalendarCheck },
  { id: "floor",        label: "FLOOR",         description: "Table turn & cleaning",      icon: Grid },
  { id: "queue",        label: "QUEUE",         description: "Wait thresholds & alerts",   icon: ListOrdered },
  { id: "orders",       label: "ORDERS",        description: "Kitchen, bar & prep times",  icon: UtensilsCrossed },
  { id: "guests",       label: "GUESTS",        description: "Visit & loyalty thresholds", icon: Users },
  { id: "hotel",        label: "HOTEL MODE",    description: "Hotel & concierge context",  icon: Hotel },
  { id: "system",       label: "SYSTEM",        description: "App info & configuration",   icon: Settings },
];

export function SettingsNav() {
  const { activeSection, setActiveSection, settings } = useSettings();
  const hotelEnabled = settings?.hotel.hotelModeEnabled ?? false;

  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;
        const isHotel = item.id === "hotel";

        return (
          <button
            key={item.id}
            id={`settings-nav-${item.id}`}
            onClick={() => setActiveSection(item.id)}
            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-purple-600/20 border border-purple-500/40 text-white"
                : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-purple-400" : "text-zinc-500"}`} />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-2">
                {item.label}
                {isHotel && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                    hotelEnabled
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "bg-zinc-700 text-zinc-500 border border-zinc-600"
                  }`}>
                    {hotelEnabled ? "ON" : "OFF"}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-zinc-600 font-sans hidden lg:block mt-0.5">{item.description}</div>
            </div>
          </button>
        );
      })}
    </nav>
  );
}
