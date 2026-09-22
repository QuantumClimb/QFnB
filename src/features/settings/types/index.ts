/**
 * Settings Feature Types — Phase 3J
 *
 * Strongly typed settings objects for all outlet configuration sections.
 *
 * Storage strategy: All settings live in outlet_settings.settings_json (JSONB).
 * TypeScript enforces structure — no untyped arbitrary JSON access in the UI.
 *
 * IMPORTANT: These are Q F&B operational settings ONLY.
 * Do NOT modify Q RESTOBAR CMS configuration through this system.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Restaurant / Outlet Identity Settings
// ─────────────────────────────────────────────────────────────────────────────

export interface RestaurantSettings {
  /** Display name shown to guests and in headings */
  displayName: string;
  phone: string;
  whatsapp: string;
  email: string;
  addressLine1: string;
  city: string;
  country: string;
  /** IANA timezone identifier, e.g. "Asia/Kuala_Lumpur" */
  timezone: string;
  /** ISO 4217 currency code, e.g. "MYR" */
  currency: string;
  /** BCP 47 locale, e.g. "en-MY" */
  locale: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service Period Settings
// ─────────────────────────────────────────────────────────────────────────────

export type ServicePeriodName = "BREAKFAST" | "LUNCH" | "DINNER" | "LATE_NIGHT";

export interface ServicePeriodConfig {
  id: ServicePeriodName;
  name: string;
  /** HH:MM 24h format, e.g. "07:00" */
  startTime: string;
  /** HH:MM 24h format, e.g. "10:30" */
  endTime: string;
  isActive: boolean;
}

export interface ServiceSettings {
  periods: ServicePeriodConfig[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Reservation Settings
// ─────────────────────────────────────────────────────────────────────────────

export interface ReservationSettings {
  /** Default dining duration in minutes (e.g. 90) */
  defaultDiningDurationMin: number;
  /** Slot interval for booking grid in minutes (e.g. 15, 30) */
  reservationIntervalMin: number;
  /** Minutes late before a reservation is flagged as "late arrival" */
  lateArrivalThresholdMin: number;
  /** Minutes late before a reservation auto-moves to "no show" consideration */
  noShowThresholdMin: number;
  /** Maximum party size allowed through public/online booking channels */
  maxOnlinePartySize: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Floor Settings
// ─────────────────────────────────────────────────────────────────────────────

export interface FloorSettings {
  /** Cleaning buffer between table turns in minutes */
  defaultCleaningBufferMin: number;
  /** Expected standard table turn duration in minutes */
  defaultTableTurnDurationMin: number;
  /** Minimum availability window for Smart Availability engine in minutes */
  smartAvailabilityMinWindowMin: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Queue / Waitlist Settings
// ─────────────────────────────────────────────────────────────────────────────

export type QueueNotificationChannel = "whatsapp" | "sms" | "app";

export interface QueueSettings {
  /** Wait minutes below which queue is considered Normal */
  normalWaitThresholdMin: number;
  /** Wait minutes at which queue is considered Busy */
  busyWaitThresholdMin: number;
  /** Wait minutes at which queue is considered High Wait */
  highWaitThresholdMin: number;
  /** Default increment when giving guest a quoted wait (minutes) */
  defaultQuoteIncrementMin: number;
  /** Preferred guest notification channel. NOTE: No real send implemented. */
  preferredNotificationChannel: QueueNotificationChannel;
}

// ─────────────────────────────────────────────────────────────────────────────
// Order Settings
// ─────────────────────────────────────────────────────────────────────────────

export type CourseType = "drinks" | "starter" | "main" | "side" | "dessert";

export interface StationConfig {
  kitchen: boolean;
  bar: boolean;
  dessert: boolean;
  service: boolean;
}

export interface OrderSettings {
  /** Minutes before an order item is flagged as needing attention */
  prepAttentionThresholdMin: number;
  /** Minutes before an order item is flagged as delayed */
  prepDelayedThresholdMin: number;
  /** Default ordering of courses */
  defaultCourseSequence: CourseType[];
  /** Which stations are active for this outlet */
  stationEnabled: StationConfig;
}

// ─────────────────────────────────────────────────────────────────────────────
// Guest Settings
// ─────────────────────────────────────────────────────────────────────────────

export interface GuestSettings {
  /**
   * Minimum visit count to classify a guest as "returning".
   * Transparent operational threshold — NOT a spend-based VIP metric.
   */
  returningGuestVisitCount: number;
  /**
   * Minimum visit count to classify a guest as "regular".
   */
  regularGuestVisitCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hotel Mode Settings
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hotel Mode Settings
 *
 * When hotelModeEnabled = false: Q F&B behaves exactly like a normal restaurant.
 * When hotelModeEnabled = true: Additional hotel guest context becomes available.
 *
 * BOUNDARIES:
 *   - NO real PMS integration implemented
 *   - NO room billing / folio posting
 *   - NO charge-to-room settlement
 *   - enableFutureChargeToRoom is architecture/eligibility flag ONLY
 */
export interface HotelSettings {
  hotelModeEnabled: boolean;
  hotelName: string;
  /** Property code used for future PMS integration reference */
  propertyCode: string;
  /** Show room number context when available in guest/reservation records */
  showRoomNumber: boolean;
  /** Allow concierge users to create reservations with hotel source context */
  enableConciergeBookings: boolean;
  /** Show hotel guest tags on guest profiles and reservations */
  enableHotelGuestTags: boolean;
  /**
   * Mark eligible reservations as charge-to-room candidates.
   * DOES NOT implement actual billing. Architecture flag only.
   * Real PMS folio integration is a future Phase 3K+ item.
   */
  enableFutureChargeToRoom: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Combined Outlet Settings Container
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Complete typed settings object stored as outlet_settings.settings_json.
 * All fields are strongly typed — no untyped JSONB access anywhere in the UI.
 */
export interface OutletSettings {
  restaurant: RestaurantSettings;
  service: ServiceSettings;
  reservations: ReservationSettings;
  floor: FloorSettings;
  queue: QueueSettings;
  orders: OrderSettings;
  guests: GuestSettings;
  hotel: HotelSettings;
}
