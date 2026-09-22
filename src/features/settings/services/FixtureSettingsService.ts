/**
 * FixtureSettingsService — Development Implementation
 * Phase 3J
 */

import type { ISettingsService } from "./ISettingsService";
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
import { DEV_FIXTURE_OUTLET_SETTINGS } from "../fixtures/settingsFixtures";

export class FixtureSettingsService implements ISettingsService {
  private settingsMap: Map<string, OutletSettings> = new Map();

  private getOrInit(outletId: string): OutletSettings {
    if (!this.settingsMap.has(outletId)) {
      this.settingsMap.set(outletId, JSON.parse(JSON.stringify(DEV_FIXTURE_OUTLET_SETTINGS)));
    }
    return this.settingsMap.get(outletId)!;
  }

  async getOutletSettings(outletId: string): Promise<OutletSettings> {
    return this.getOrInit(outletId);
  }

  async updateRestaurantSettings(outletId: string, partial: Partial<RestaurantSettings>): Promise<RestaurantSettings> {
    const s = this.getOrInit(outletId);
    s.restaurant = { ...s.restaurant, ...partial };
    return s.restaurant;
  }

  async updateServiceSettings(outletId: string, partial: Partial<ServiceSettings>): Promise<ServiceSettings> {
    const s = this.getOrInit(outletId);
    s.service = { ...s.service, ...partial };
    return s.service;
  }

  async updateReservationSettings(outletId: string, partial: Partial<ReservationSettings>): Promise<ReservationSettings> {
    const s = this.getOrInit(outletId);
    s.reservations = { ...s.reservations, ...partial };
    return s.reservations;
  }

  async updateFloorSettings(outletId: string, partial: Partial<FloorSettings>): Promise<FloorSettings> {
    const s = this.getOrInit(outletId);
    s.floor = { ...s.floor, ...partial };
    return s.floor;
  }

  async updateQueueSettings(outletId: string, partial: Partial<QueueSettings>): Promise<QueueSettings> {
    const s = this.getOrInit(outletId);
    s.queue = { ...s.queue, ...partial };
    return s.queue;
  }

  async updateOrderSettings(outletId: string, partial: Partial<OrderSettings>): Promise<OrderSettings> {
    const s = this.getOrInit(outletId);
    s.orders = { ...s.orders, ...partial };
    return s.orders;
  }

  async updateGuestSettings(outletId: string, partial: Partial<GuestSettings>): Promise<GuestSettings> {
    const s = this.getOrInit(outletId);
    s.guests = { ...s.guests, ...partial };
    return s.guests;
  }

  async updateHotelSettings(outletId: string, partial: Partial<HotelSettings>): Promise<HotelSettings> {
    const s = this.getOrInit(outletId);
    s.hotel = { ...s.hotel, ...partial };
    return s.hotel;
  }
}
