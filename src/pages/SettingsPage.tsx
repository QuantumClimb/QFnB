import React from "react";
import { SettingsProvider, useSettings } from "../features/settings/context/SettingsContext";
import type { SettingsSection } from "../features/settings/context/SettingsContext";
import { SettingsNav } from "../features/settings/components/SettingsNav";
import { RestaurantSettingsPanel } from "../features/settings/components/RestaurantSettingsPanel";
import { ServiceSettingsPanel } from "../features/settings/components/ServiceSettingsPanel";
import { ReservationSettingsPanel } from "../features/settings/components/ReservationSettingsPanel";
import { FloorSettingsPanel } from "../features/settings/components/FloorSettingsPanel";
import { QueueSettingsPanel } from "../features/settings/components/QueueSettingsPanel";
import { OrderSettingsPanel } from "../features/settings/components/OrderSettingsPanel";
import { GuestSettingsPanel } from "../features/settings/components/GuestSettingsPanel";
import { HotelModePanel } from "../features/settings/components/HotelModePanel";
import { SystemSettingsPanel } from "../features/settings/components/SystemSettingsPanel";
import { useOrg } from "../context/OrgContext";
import { can } from "../features/staff/permissions";
import { AccessDenied } from "../components/AccessDenied";

function PanelRouter({ section }: { section: SettingsSection }) {
  switch (section) {
    case "restaurant":   return <RestaurantSettingsPanel />;
    case "service":      return <ServiceSettingsPanel />;
    case "reservations": return <ReservationSettingsPanel />;
    case "floor":        return <FloorSettingsPanel />;
    case "queue":        return <QueueSettingsPanel />;
    case "orders":       return <OrderSettingsPanel />;
    case "guests":       return <GuestSettingsPanel />;
    case "hotel":        return <HotelModePanel />;
    case "system":       return <SystemSettingsPanel />;
    default:             return <RestaurantSettingsPanel />;
  }
}

function SettingsPageContent() {
  const { activeSection, setActiveSection, isLoading, isSaving } = useSettings();
  const { role } = useOrg();

  if (!can(role, "settings.read")) {
    return <AccessDenied module="Settings" />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-zinc-500 font-mono text-sm animate-pulse">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div>
        <div className="text-purple-400 uppercase tracking-widest text-[10px] font-mono mb-1">
          OUTLET CONFIGURATION
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-white uppercase font-mono tracking-tight">SETTINGS</h1>
          {isSaving && (
            <span className="text-[10px] text-amber-400 font-mono animate-pulse">SAVING...</span>
          )}
        </div>
      </div>

      {/* Desktop: Side nav + Content panel */}
      <div className="hidden lg:grid grid-cols-[220px_1fr] gap-6 items-start">
        <div className="bg-zinc-900 border border-white/8 rounded-xl p-3 sticky top-24">
          <SettingsNav />
        </div>
        <div className="bg-zinc-900 border border-white/8 rounded-xl p-6">
          <PanelRouter section={activeSection} />
        </div>
      </div>

      {/* Mobile/Tablet: Section picker + Active panel stacked */}
      <div className="lg:hidden space-y-4">
        {/* Section picker — horizontal scroll tabs on mobile */}
        <div className="bg-zinc-900 border border-white/8 rounded-xl p-3">
          <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-2 px-2">SECTION</div>
          <SettingsNav />
        </div>

        {/* Active section content */}
        <div className="bg-zinc-900 border border-white/8 rounded-xl p-5">
          <PanelRouter section={activeSection} />
        </div>
      </div>
    </div>
  );
}

export function SettingsPage() {
  return (
    <SettingsProvider>
      <SettingsPageContent />
    </SettingsProvider>
  );
}
