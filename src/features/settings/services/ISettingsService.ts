/**
 * ISettingsService — Settings Feature Service Interface
 * Phase 3J
 */

import type {
  OutletSettings,
  RestaurantSettings,
  ServiceSettings,
  ReservationSettings,
  FloorSettings,
  QueueSettings,
  OrderSettings,
  GuestSettings,
  HotelSettings,
} from "../types";

export interface ISettingsService {
  /** Load the complete settings for an outlet */
  getOutletSettings(outletId: string): Promise<OutletSettings>;

  /** Update restaurant/identity settings */
  updateRestaurantSettings(outletId: string, partial: Partial<RestaurantSettings>): Promise<RestaurantSettings>;

  /** Update service period settings */
  updateServiceSettings(outletId: string, partial: Partial<ServiceSettings>): Promise<ServiceSettings>;

  /** Update reservation configuration */
  updateReservationSettings(outletId: string, partial: Partial<ReservationSettings>): Promise<ReservationSettings>;

  /** Update floor plan operational settings */
  updateFloorSettings(outletId: string, partial: Partial<FloorSettings>): Promise<FloorSettings>;

  /** Update queue/waitlist thresholds */
  updateQueueSettings(outletId: string, partial: Partial<QueueSettings>): Promise<QueueSettings>;

  /** Update order/kitchen/bar settings */
  updateOrderSettings(outletId: string, partial: Partial<OrderSettings>): Promise<OrderSettings>;

  /** Update guest classification thresholds */
  updateGuestSettings(outletId: string, partial: Partial<GuestSettings>): Promise<GuestSettings>;

  /**
   * Update hotel mode settings.
   *
   * SECURITY: Hotel mode enable/disable should be restricted to owner/admin
   * in production via Supabase RLS on outlet_settings.
   */
  updateHotelSettings(outletId: string, partial: Partial<HotelSettings>): Promise<HotelSettings>;
}
