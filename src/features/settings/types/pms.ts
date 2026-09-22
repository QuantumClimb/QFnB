/**
 * IPmsIntegrationService — Future PMS Integration Interface
 * Phase 3J
 *
 * This interface documents the FUTURE boundary for Property Management System (PMS)
 * integration. It is NOT implemented. All methods throw in the current phase.
 *
 * Potential future PMS providers:
 *   - Opera (Oracle Hospitality)
 *   - Mews
 *   - Cloudbeds
 *   - Protel
 *   - Other PMS systems via REST API adapters
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 3J BOUNDARY
 * ═══════════════════════════════════════════════════════════════════════════
 * DO NOT implement provider integrations in Phase 3J.
 * DO NOT make external network calls to PMS endpoints.
 * This file exists purely as an architectural boundary document.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { HotelGuestContext, HotelVipStatus } from "./hotel";

// ─────────────────────────────────────────────────────────────────────────────
// PMS Query Input Types
// ─────────────────────────────────────────────────────────────────────────────

export interface FindGuestInput {
  /** Hotel room number */
  roomNumber?: string;
  /** Hotel folio / reservation reference */
  folioReference?: string;
  /** Guest last name (for lookup) */
  lastName?: string;
}

export interface ValidateRoomInput {
  roomNumber: string;
  /** Expected guest last name for validation */
  guestLastName?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PMS Response Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PmsGuestRecord {
  folioReference: string;
  roomNumber: string;
  guestFullName: string;
  arrivalDate: string;
  departureDate: string;
  vipStatus: HotelVipStatus | null;
  membershipLevel: string | null;
  chargeToRoomEligible: boolean;
  isCheckedIn: boolean;
}

export interface PmsRoomValidationResult {
  isValid: boolean;
  roomNumber: string;
  isOccupied: boolean;
  guestName?: string;
  checkoutDate?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Interface
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Future PMS integration service interface.
 *
 * When implementing, create a provider-specific class:
 *   - OperaPmsService implements IPmsIntegrationService
 *   - MewsPmsService implements IPmsIntegrationService
 *   - CloudbedsPmsService implements IPmsIntegrationService
 *
 * Each provider connects to its respective API using the hotel's configured
 * credentials (stored securely server-side, never in client-side settings).
 */
export interface IPmsIntegrationService {
  /**
   * Find an in-house hotel guest by room number, folio, or name.
   * Returns null if no matching in-house guest found.
   */
  findInHouseGuest(input: FindGuestInput): Promise<PmsGuestRecord | null>;

  /**
   * Validate that a room number exists and is currently occupied.
   */
  validateRoom(input: ValidateRoomInput): Promise<PmsRoomValidationResult>;

  /**
   * Get stay dates for a specific room/folio reference.
   */
  getStayDates(folioReference: string): Promise<{ arrivalDate: string; departureDate: string } | null>;

  /**
   * Get VIP status for a guest record.
   */
  getVipStatus(folioReference: string): Promise<HotelVipStatus | null>;

  /**
   * Check if a guest/room is eligible for charge-to-room.
   * DOES NOT post charges — eligibility check only.
   */
  getRoomChargeEligibility(folioReference: string): Promise<boolean>;
}
