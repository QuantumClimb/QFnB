/**
 * SupabaseSettingsService — Production Stub
 * Phase 3J
 *
 * Future implementation notes:
 *
 * Storage: outlet_settings table with settings_json JSONB column.
 * RLS:
 *   - SELECT: any org member with is_org_member()
 *   - UPDATE: only owner/admin/manager roles
 *
 * When implementing:
 * 1. SELECT from outlet_settings WHERE outlet_id = $1
 * 2. Parse settings_json and validate against OutletSettings type
 * 3. UPSERT on update methods
 * 4. Use optimistic locking via updated_at for concurrent edit safety
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

export class SupabaseSettingsService implements ISettingsService {
  async getOutletSettings(_outletId: string): Promise<OutletSettings> {
    throw new Error("SupabaseSettingsService: Not implemented. Connect Supabase.");
  }
  async updateRestaurantSettings(_o: string, _p: Partial<RestaurantSettings>): Promise<RestaurantSettings> {
    throw new Error("SupabaseSettingsService: Not implemented.");
  }
  async updateServiceSettings(_o: string, _p: Partial<ServiceSettings>): Promise<ServiceSettings> {
    throw new Error("SupabaseSettingsService: Not implemented.");
  }
  async updateReservationSettings(_o: string, _p: Partial<ReservationSettings>): Promise<ReservationSettings> {
    throw new Error("SupabaseSettingsService: Not implemented.");
  }
  async updateFloorSettings(_o: string, _p: Partial<FloorSettings>): Promise<FloorSettings> {
    throw new Error("SupabaseSettingsService: Not implemented.");
  }
  async updateQueueSettings(_o: string, _p: Partial<QueueSettings>): Promise<QueueSettings> {
    throw new Error("SupabaseSettingsService: Not implemented.");
  }
  async updateOrderSettings(_o: string, _p: Partial<OrderSettings>): Promise<OrderSettings> {
    throw new Error("SupabaseSettingsService: Not implemented.");
  }
  async updateGuestSettings(_o: string, _p: Partial<GuestSettings>): Promise<GuestSettings> {
    throw new Error("SupabaseSettingsService: Not implemented.");
  }
  async updateHotelSettings(_o: string, _p: Partial<HotelSettings>): Promise<HotelSettings> {
    throw new Error("SupabaseSettingsService: Not implemented.");
  }
}
