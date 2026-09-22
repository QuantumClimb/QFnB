import React from "react";
import { QueueProvider, useQueue } from "../features/queue/context/QueueContext";
import { QueueHeader } from "../features/queue/components/QueueHeader";
import { QueueFilters } from "../features/queue/components/QueueFilters";
import { LiveQueueBoard } from "../features/queue/components/LiveQueueBoard";
import { QueueSidePanel } from "../features/queue/components/QueueSidePanel";
import { AddWaitlistModal } from "../features/queue/components/AddWaitlistModal";
import { WaitlistDetailDrawer } from "../features/queue/components/WaitlistDetailDrawer";
import { SeatFromQueueModal } from "../features/queue/components/SeatFromQueueModal";
import { NotifyGuestModal } from "../features/queue/components/NotifyGuestModal";
import { CheckCircle, X } from "lucide-react";

function QueueWorkspace() {
  const { toastMessage, clearToast } = useQueue();

  return (
    <div className="space-y-5">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-amber-400 text-zinc-950 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-mono text-xs font-bold animate-in slide-in-from-top duration-200">
          <CheckCircle className="w-4 h-4 stroke-[2.5]" />
          <span>{toastMessage}</span>
          <button 
            onClick={clearToast}
            className="p-1 hover:bg-black/10 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner & Operational Metrics */}
      <QueueHeader />

      {/* Filter Bar */}
      <QueueFilters />

      {/* Main Grid: Queue Board + Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Live Queue Cards (8 cols on desktop, full width on mobile/tablet) */}
        <div className="lg:col-span-8 space-y-4">
          <LiveQueueBoard />
        </div>

        {/* Side Panel: Ready Guests & Floor Suggestions (4 cols on desktop) */}
        <div className="lg:col-span-4 space-y-4">
          <QueueSidePanel />
        </div>
      </div>

      {/* Modals & Slide-Over Drawers */}
      <AddWaitlistModal />
      <WaitlistDetailDrawer />
      <SeatFromQueueModal />
      <NotifyGuestModal />
    </div>
  );
}

export function QueuePage() {
  return (
    <QueueProvider>
      <QueueWorkspace />
    </QueueProvider>
  );
}

export default QueuePage;
