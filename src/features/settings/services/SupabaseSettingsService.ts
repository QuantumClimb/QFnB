import { supabase } from "../../../lib/supabase";
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

/**
 * Production Supabase implementation of ISettingsService.
 * Reads and writes JSONB settings in the `outlet_settings` table.
 */
export class SupabaseSettingsService implements ISettingsService {
  async getOutletSettings(outletId: string): Promise<OutletSettings> {
    const { data, error } = await supabase
      .from("outlet_settings")
      .select("settings_json")
      .eq("outlet_id", outletId)
      .maybeSingle();

    if (error) {
      console.error("[SupabaseSettingsService] getOutletSettings error:", error);
      return DEV_FIXTURE_OUTLET_SETTINGS;
    }

    if (!data || !data.settings_json || Object.keys(data.settings_json).length === 0) {
      return DEV_FIXTURE_OUTLET_SETTINGS;
    }

    return {
      ...DEV_FIXTURE_OUTLET_SETTINGS,
      ...data.settings_json,
    };
  }

  private async updateSection<K extends keyof OutletSettings>(
    outletId: string,
    section: K,
    partial: Partial<OutletSettings[K]>
  ): Promise<OutletSettings[K]> {
    const current = await this.getOutletSettings(outletId);
    const updatedSection = {
      ...current[section],
      ...partial,
    };

    const newSettings = {
      ...current,
      [section]: updatedSection,
    };

    const { error } = await supabase
      .from("outlet_settings")
      .upsert(
        {
          outlet_id: outletId,
          settings_json: newSettings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "outlet_id" }
      );

    if (error) {
      console.error(`[SupabaseSettingsService] updateSection ${String(section)} error:`, error);
      throw error;
    }

    return updatedSection as OutletSettings[K];
  }

  async updateRestaurantSettings(outletId: string, partial: Partial<RestaurantSettings>): Promise<RestaurantSettings> {
    return this.updateSection(outletId, "restaurant", partial);
  }

  async updateServiceSettings(outletId: string, partial: Partial<ServiceSettings>): Promise<ServiceSettings> {
    return this.updateSection(outletId, "service", partial);
  }

  async updateReservationSettings(outletId: string, partial: Partial<ReservationSettings>): Promise<ReservationSettings> {
    return this.updateSection(outletId, "reservations", partial);
  }

  async updateFloorSettings(outletId: string, partial: Partial<FloorSettings>): Promise<FloorSettings> {
    return this.updateSection(outletId, "floor", partial);
  }

  async updateQueueSettings(outletId: string, partial: Partial<QueueSettings>): Promise<QueueSettings> {
    return this.updateSection(outletId, "queue", partial);
  }

  async updateOrderSettings(outletId: string, partial: Partial<OrderSettings>): Promise<OrderSettings> {
    return this.updateSection(outletId, "orders", partial);
  }

  async updateGuestSettings(outletId: string, partial: Partial<GuestSettings>): Promise<GuestSettings> {
    return this.updateSection(outletId, "guests", partial);
  }

  async updateHotelSettings(outletId: string, partial: Partial<HotelSettings>): Promise<HotelSettings> {
    return this.updateSection(outletId, "hotel", partial);
  }
}
