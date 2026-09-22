/**
 * Hotel Guest Context Types — Phase 3J
 *
 * Optional hotel guest data that can be attached to reservations and guest profiles
 * when Hotel Mode is enabled.
 *
 * STRICT BOUNDARY:
 *   - This is informational context ONLY
 *   - NO real PMS integration
 *   - NO room billing / folio posting / payment settlement
 *   - charge_to_room_eligible is an eligibility FLAG only
 *   - Queue fairness is NOT affected by hotel guest status (Phase 3E.2 preserved)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Hotel Guest Context
// ─────────────────────────────────────────────────────────────────────────────

export type HotelVipStatus =
  | "standard"
  | "preferred"
  | "executive_floor"
  | "suite"
  | "vvip";

export interface HotelGuestContext {
  /** Whether this is identified as a hotel guest */
  hotel_guest: boolean;
  /** Room number string, e.g. "1804" */
  room_number: string | null;
  /** Display name from hotel registration (may differ from booking name) */
  hotel_guest_name: string | null;
  /** ISO date of hotel arrival, e.g. "2026-09-19" */
  arrival_date: string | null;
  /** ISO date of hotel departure, e.g. "2026-09-23" */
  departure_date: string | null;
  /** Whether this reservation was created by hotel concierge */
  concierge_booking: boolean;
  /** VIP tier from hotel records (informational only) */
  hotel_vip_status: HotelVipStatus | null;
  /** Hotel membership/loyalty program level (nullable) */
  hotel_membership_level: string | null;
  /**
   * Eligibility flag for future charge-to-room capability.
   * Does NOT implement actual billing. PMS folio integration is future scope.
   */
  charge_to_room_eligible: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Concierge Booking Source Context
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Additional context for reservations created by hotel concierge staff.
 * Maps to booking_source = 'hotel_concierge' in the reservations table.
 */
export interface ConciergeBookingContext {
  /** Room number of the hotel guest making the reservation */
  hotel_room_number: string | null;
  /** Internal hotel guest reference/folio number */
  hotel_guest_reference: string | null;
  /** Concierge staff identifier or name (informational) */
  concierge_source: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hotel Guest Display Helper
// ─────────────────────────────────────────────────────────────────────────────

export function formatVipStatus(status: HotelVipStatus | null): string {
  if (!status) return "Standard";
  switch (status) {
    case "standard":       return "Standard";
    case "preferred":      return "Preferred";
    case "executive_floor": return "Executive Floor";
    case "suite":          return "Suite Guest";
    case "vvip":           return "VVIP";
    default:               return status;
  }
}
