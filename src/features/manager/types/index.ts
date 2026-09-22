// Domain Types for Manager Live View + Basic Insights (Phase 3I)

export type ManagerViewMode = "LIVE_SERVICE" | "TODAY" | "INSIGHTS";

export type ServicePeriod = "BREAKFAST" | "LUNCH" | "DINNER" | "LATE_NIGHT";

export type ServiceStatus = "NORMAL" | "ACTIVE_PEAK" | "HIGH_PRESSURE" | "CLOSING";

export type AlertSeverity = "INFO" | "ATTENTION" | "URGENT";

export type AlertType =
  | "reservation_late"
  | "vip_arriving"
  | "queue_overdue"
  | "table_turn_overdue"
  | "table_cleaning_delay"
  | "order_delayed"
  | "ready_item_waiting"
  | "experience_upcoming";

export interface ServiceAlert {
  id: string; // Deterministic deduplicated key, e.g. "order-item:104:delayed"
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  entityRef: {
    type: "order" | "table" | "reservation" | "queue" | "guest" | "experience";
    id: string;
    label: string;
  };
  outletId: string;
  createdAt: string;
  actionLabel: string;
  targetRoute: string; // e.g. "/app/orders", "/app/floor"
}

export interface ManagerLiveKpis {
  coversInHouse: number;
  expectedCoversToday: number;
  tablesOccupied: number;
  tablesAvailable: number;
  activeWaitlistParties: number;
  averageActiveWaitMinutes: number;
  ordersPreparing: number;
  ordersReady: number;
  serviceAlertsCount: number;
}

export interface ZoneSummary {
  areaId: string;
  areaName: string;
  occupied: number;
  total: number;
  occupancyPercentage: number;
}

export interface TableAttentionItem {
  tableId: string;
  tableNumber: string;
  reason: string;
  severity: AlertSeverity;
  minutesElapsed?: number;
  guestName?: string;
  targetRoute: string;
}

export interface ManagerFloorPressure {
  occupiedCount: number;
  availableCount: number;
  reservedCount: number;
  arrivingCount: number;
  billRequestedCount: number;
  cleaningCount: number;
  blockedCount: number;
  zoneSummaries: ZoneSummary[];
  tablesNeedingAttention: TableAttentionItem[];
}

export interface UpcomingArrivalItem {
  id: string;
  time: string;
  guestName: string;
  partySize: number;
  tags?: string[];
  experienceTitle?: string;
  status: string;
}

export interface LateArrivalItem {
  id: string;
  time: string;
  guestName: string;
  partySize: number;
  minutesLate: number;
}

export interface ArrivedNotSeatedItem {
  id: string;
  guestName: string;
  partySize: number;
  arrivedAt: string;
}

export interface VipArrivalItem {
  id: string;
  time: string;
  guestName: string;
  partySize: number;
  vipNote?: string;
}

export interface ManagerReservationPressure {
  nextArrivals: UpcomingArrivalItem[];
  lateArrivals: LateArrivalItem[];
  arrivedNotSeated: ArrivedNotSeatedItem[];
  vipArrivals: VipArrivalItem[];
  celebrationCount: number;
  totalReservationsToday: number;
}

export interface ManagerQueuePressure {
  waitingPartiesCount: number;
  guestsWaitingCount: number;
  averageWaitMinutes: number;
  longestWaitMinutes: number;
  pressureLevel: "NORMAL" | "BUSY" | "HIGH_WAIT";
  readyForSeatingCount: number;
  tablesPreparingCount: number;
}

export interface StationLoadItem {
  station: "kitchen" | "bar" | "dessert" | "service";
  preparing: number;
  ready: number;
  delayed: number;
}

export interface ManagerOrderPressure {
  ordersActiveCount: number;
  itemsPreparingCount: number;
  itemsReadyCount: number;
  delayedItemsCount: number;
  stationLoad: StationLoadItem[];
}

export interface GuestMomentItem {
  guestId?: string;
  guestName: string;
  type: "VIP" | "BIRTHDAY" | "ANNIVERSARY" | "RETURNING" | "ALLERGY";
  details: string;
  time?: string;
  tableNumber?: string;
  targetRoute: string;
}

export interface ManagerExperienceBookingItem {
  reservationId: string;
  time: string;
  guestName: string;
  experienceTitle: string;
  addons: string[];
  status: string;
  partySize: number;
  tableLabel?: string;
}

export interface OperationalTimelineEvent {
  id: string;
  time: string;
  title: string;
  description?: string;
  category: "floor" | "order" | "queue" | "reservation" | "experience";
  severity?: AlertSeverity;
}

export interface ManagerTodaySummary {
  reservationsTodayCount: number;
  completedReservationsCount: number;
  noShowCount: number;
  cancellationCount: number;
  walkInCoversCount: number;
  totalCoversToday: number;
  guestsSeatedToday: number;
  waitlistTotalPartiesToday: number;
  completedOrdersCount: number;
  experienceBookingsCount: number;
}

export interface ReservationSourceMixItem {
  source: string;
  count: number;
  percentage: number;
}

export interface ServicePeriodCoversItem {
  period: string;
  covers: number;
  percentage: number;
}

export interface ManagerBasicInsights {
  busiestServicePeriod: string;
  averageWaitMinutes: number;
  averageTableTurnMinutes: number;
  averageOrderPrepMinutes: number;
  mostUsedSeatingArea: string;
  mostBookedExperience: string;
  reservationSourceMix: ReservationSourceMixItem[];
  servicePeriodMix: ServicePeriodCoversItem[];
  guestReturnRate: {
    returningGuests: number;
    totalGuestsAnalyzed: number;
    percentage: number;
  };
}

export interface ManagerSnapshot {
  lastRefreshedAt: string;
  outletId: string;
  outletName: string;
  servicePeriod: ServicePeriod;
  serviceStatus: ServiceStatus;
  currentManager: string;
  kpis: ManagerLiveKpis;
  alerts: ServiceAlert[];
  floor: ManagerFloorPressure;
  reservations: ManagerReservationPressure;
  queue: ManagerQueuePressure;
  orders: ManagerOrderPressure;
  guestMoments: GuestMomentItem[];
  experiences: ManagerExperienceBookingItem[];
  timeline: OperationalTimelineEvent[];
  todaySummary: ManagerTodaySummary;
  insights: ManagerBasicInsights;
}
