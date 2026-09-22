export type ServicePeriodStatus = "prep" | "active" | "peak" | "closing" | "closed";

export interface ServicePeriodInfo {
  name: string; // e.g., "Dinner Service"
  status: ServicePeriodStatus;
  statusLabel: string; // e.g., "ACTIVE PEAK"
  shiftTime: string; // e.g., "17:30 - 23:00"
  shiftManager: string; // e.g., "Marcus Vance (GM)"
  servicePacingStatus: "optimal" | "busy" | "overloaded";
}

export interface OperationalKPIs {
  reservationsCount: number;
  reservationsConfirmed: number;
  reservationsSeated: number;
  reservationsCancelled: number;
  expectedCovers: number;
  coversSeated: number;
  coversRemaining: number;
  guestsSeatedCount: number;
  seatingCapacityMax: number;
  tablesAvailableCount: number;
  tablesTotalCount: number;
  activeWaitlistParties: number;
  activeWaitlistCovers: number;
  avgWaitTimeMinutes: number;
  pendingOrdersCount: number;
  pendingOrdersDelayedCount: number;
  ordersReadyCount: number;
  serviceAlertsCount: number;
}

export type ReservationStatus =
  | "confirmed"
  | "arriving_soon"
  | "seated"
  | "late"
  | "partially_seated"
  | "completed"
  | "cancelled";

export type GuestTier = "regular" | "vip" | "vvip" | "first_time" | "industry";

export interface UpcomingReservation {
  id: string;
  guestName: string;
  guestPhone: string;
  guestTier: GuestTier;
  partySize: number;
  time: string; // e.g. "19:30"
  tableNumber: string | null; // e.g. "T-12" or null if unassigned
  section: string; // e.g. "Main Dining Room"
  status: ReservationStatus;
  tags: string[]; // e.g. ["Anniversary", "Window Table", "Allergy: Peanuts"]
  notes?: string;
  depositPaid?: boolean;
  visitSummary?: string;
}

export type WaitlistStatus = "waiting" | "notified" | "ready" | "seated" | "cancelled";

export interface WaitlistItem {
  id: string;
  guestName: string;
  guestPhone: string;
  partySize: number;
  quotedTimeMins: number;
  elapsedMins: number;
  preferredSection: "Main Dining" | "Bar High-Tops" | "Terrace" | "Any";
  status: WaitlistStatus;
  notes?: string;
  notifiedAt?: string;
}

export type OrderPacingStatus = "preparing" | "ready" | "delayed" | "served";
export type OrderDestination = "Kitchen" | "Cocktail Bar" | "Pastry / Dessert";

export interface LiveOrderItem {
  id: string;
  orderNumber: string; // e.g. "#408"
  tableNumber: string; // e.g. "T-04"
  serverName: string; // e.g. "Elena"
  destination: OrderDestination;
  summary: string; // e.g. "2x Wagyu Ribeye (M/R), 1x Truffle Risotto"
  itemCount: number;
  status: OrderPacingStatus;
  elapsedMinutes: number;
  isUrgent?: boolean;
}

export interface FloorSectionStatus {
  id: string;
  name: string; // e.g. "Main Dining Room"
  tablesTotal: number;
  tablesOccupied: number;
  tablesReserved: number;
  tablesAvailable: number;
  capacityCovers: number;
  seatedCovers: number;
  turnaroundAvgMins: number;
}

export type AlertSeverity = "urgent" | "warning" | "info";
export type AlertCategory =
  | "late_arrival"
  | "unassigned_vip"
  | "kitchen_delay"
  | "waitlist_exceeded"
  | "special_request";

export interface ServiceAlert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  description: string;
  timestamp: string; // e.g. "3 mins ago"
  actionableId?: string;
  actionLabel?: string;
}

export interface GuestMoment {
  id: string;
  guestName: string;
  guestTier: GuestTier;
  tableNumber: string;
  occasion: string; // e.g. "25th Wedding Anniversary", "Birthday Celebration"
  specialDetail: string; // e.g. "Prefers 2018 Bordeaux, complimentary champagne chilled"
  assignedStaff: string; // e.g. "Chef Luca & Lead Sommelier"
}

export interface SmartAvailabilitySlot {
  partySize: number;
  nextAvailableTime: string; // e.g. "Immediate", "19:45", "20:30"
  suggestedTable: string; // e.g. "T-08 (Bar High-Top)"
  confidence: "high" | "limited" | "waitlist_only";
  section: string;
}

export interface DashboardData {
  servicePeriod: ServicePeriodInfo;
  kpis: OperationalKPIs;
  upcomingReservations: UpcomingReservation[];
  activeWaitlist: WaitlistItem[];
  liveOrders: LiveOrderItem[];
  floorSections: FloorSectionStatus[];
  serviceAlerts: ServiceAlert[];
  guestMoments: GuestMoment[];
  smartAvailability: SmartAvailabilitySlot[];
  lastUpdated: string;
}
