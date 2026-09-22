import React from 'react';
import { 
  ManagerProvider, 
  useManager, 
  ManagerHeader, 
  ManagerKpiBar, 
  ServiceAlertsBanner,
  FloorPressureCard,
  ReservationsPanel,
  QueuePressureCard,
  KitchenPressureCard,
  GuestMomentsCard,
  ExperienceBookingsCard,
  OperationalTimelineCard,
  ManagerTodayTab,
  ManagerInsightsTab
} from '../features/manager';
import { RefreshCw, AlertTriangle } from 'lucide-react';

const ManagerLiveViewContent: React.FC = () => {
  const { snapshot, isLoading, error, viewMode, refreshSnapshot } = useManager();

  if (isLoading && !snapshot) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
        <div className="text-center">
          <h3 className="text-sm font-semibold text-white">Synthesizing Manager Live View</h3>
          <p className="text-xs text-[#8E929C] mt-1">Aggregating floor, reservations, queue, kitchen, and guest states...</p>
        </div>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="p-6 rounded-xl bg-rose-950/20 border border-rose-800/40 text-center space-y-3 my-8">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
        <h3 className="text-sm font-semibold text-white">Failed to Load Manager Operations</h3>
        <p className="text-xs text-rose-300 max-w-md mx-auto">{error || 'Unknown error occurred while synthesizing operational snapshot.'}</p>
        <button
          type="button"
          onClick={() => refreshSnapshot()}
          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors inline-flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Live Sync</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Shift Info & View Tabs */}
      <ManagerHeader />

      {/* VIEW: LIVE SERVICE */}
      {viewMode === 'LIVE_SERVICE' && (
        <div className="space-y-6">
          {/* 8 Live Operational KPI Cards */}
          <ManagerKpiBar />

          {/* Urgent / Attention Service Alerts */}
          <ServiceAlertsBanner alerts={snapshot.alerts} />

          {/* Dual Grid: Floor & Reservations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FloorPressureCard floor={snapshot.floor} />
            <ReservationsPanel reservations={snapshot.reservations} />
          </div>

          {/* Dual Grid: Kitchen & Waitlist */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <KitchenPressureCard orders={snapshot.orders} />
            <QueuePressureCard queue={snapshot.queue} />
          </div>

          {/* Dual Grid: VIPs/Moments & Attached Experiences */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GuestMomentsCard moments={snapshot.guestMoments} />
            <ExperienceBookingsCard experiences={snapshot.experiences} />
          </div>

          {/* Stream Log: Real-time Operational Stream */}
          <div>
            <OperationalTimelineCard events={snapshot.timeline} />
          </div>
        </div>
      )}

      {/* VIEW: TODAY SUMMARY */}
      {viewMode === 'TODAY' && (
        <ManagerTodayTab today={snapshot.todaySummary} />
      )}

      {/* VIEW: OPERATIONAL INSIGHTS */}
      {viewMode === 'INSIGHTS' && (
        <ManagerInsightsTab insights={snapshot.insights} />
      )}
    </div>
  );
};

export function InsightsPage() {
  return (
    <ManagerProvider>
      <ManagerLiveViewContent />
    </ManagerProvider>
  );
}

export default InsightsPage;
