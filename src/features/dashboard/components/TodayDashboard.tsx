import React, { useState } from "react";
import { TodayHeader } from "./TodayHeader";
import { OperationalMetricsGrid } from "./OperationalMetricsGrid";
import { NeedsAttentionPanel } from "./NeedsAttentionPanel";
import { UpcomingReservationsPanel } from "./UpcomingReservationsPanel";
import { ActiveWaitlistPanel } from "./ActiveWaitlistPanel";
import { LiveOrdersPreview } from "./LiveOrdersPreview";
import { FloorStatusPreview } from "./FloorStatusPreview";
import { GuestMomentsPanel } from "./GuestMomentsPanel";
import { SmartAvailabilityPreview } from "./SmartAvailabilityPreview";
import { QuickActionsModal } from "./QuickActionsModal";
import { useDashboard } from "../context/DashboardContext";
import { AlertCircle, RotateCw } from "lucide-react";

export function TodayDashboard() {
  const { isLoading, error, refreshData } = useDashboard();
  const [modalType, setModalType] = useState<"walkin" | "waitlist" | null>(null);

  if (error) {
    return (
      <div className="p-8 bg-zinc-900 border border-rose-500/30 rounded-2xl text-center space-y-4 font-mono">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white uppercase">UNABLE TO LOAD LIVE OPERATIONS</h2>
        <p className="text-zinc-400 text-sm max-w-md mx-auto font-sans">{error}</p>
        <button
          onClick={() => refreshData()}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-2"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Retry Service Connection</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 font-sans">
      
      {/* 1. Header with shift info and fast action triggers */}
      <TodayHeader
        onOpenWalkInModal={() => setModalType("walkin")}
        onOpenWaitlistModal={() => setModalType("waitlist")}
      />

      {/* 2. 8 Operational KPIs Metric Grid */}
      <OperationalMetricsGrid />

      {/* 3. Needs Attention Panel (Service Watch) */}
      <NeedsAttentionPanel />

      {/* 4. Core Operational Flow: Upcoming Reservations (8 cols) + Active Waitlist (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Upcoming Bookings & Service Pacing (7 or 8 Cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <UpcomingReservationsPanel />
          <LiveOrdersPreview />
        </div>

        {/* Right: Active Waitlist & Guest Moments (5 or 4 Cols) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <ActiveWaitlistPanel />
          <GuestMomentsPanel />
        </div>

      </div>

      {/* 5. Floor Matrix Status & Smart Availability Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 xl:col-span-7">
          <FloorStatusPreview />
        </div>
        <div className="lg:col-span-5 xl:col-span-5">
          <SmartAvailabilityPreview />
        </div>
      </div>

      {/* Fast Action Modal Dialog */}
      <QuickActionsModal
        type={modalType}
        onClose={() => setModalType(null)}
      />

    </div>
  );
}
