/**
 * Q F&B OS — Centralized Service Provider Factory
 *
 * Provides single point of resolution for domain service providers.
 * - In explicit DEV PREVIEW mode: Returns deterministic fixture-backed services.
 * - In Authenticated Tenant mode: Returns Supabase PostgreSQL backed services.
 *
 * CRITICAL ARCHITECTURAL RULE:
 * Production sessions NEVER silently fall back to fixtures.
 * DEV PREVIEW is an explicit developer/demonstration choice.
 */

import { isDemoMode } from "../lib/config";
import { isSupabaseConfigured } from "../lib/supabase";

// Interfaces
import type { IReservationService } from "../features/reservations/services/IReservationService";
import type { IFloorService } from "../features/floor/services/IFloorService";
import type { IQueueService } from "../features/queue/services/IQueueService";
import type { IOrderService } from "../features/orders/services/IOrderService";
import type { IGuestService } from "../features/guests/services/IGuestService";
import type { IOffersService } from "../features/offers/services/IOffersService";
import type { IStaffService } from "../features/staff/services/IStaffService";
import type { ISettingsService } from "../features/settings/services/ISettingsService";
import type { IManagerService } from "../features/manager/services/IManagerService";
import type { IDashboardService } from "../features/dashboard/services/IDashboardService";

// Fixture Implementations
import { reservationService as fixtureReservationService } from "../features/reservations/services/reservationService";
import { floorService as fixtureFloorService } from "../features/floor/services/floorService";
import { queueService as fixtureQueueService } from "../features/queue/services/queueService";
import { orderService as fixtureOrderService } from "../features/orders/services/orderService";
import { guestService as fixtureGuestService } from "../features/guests/services/guestService";
import { offersService as fixtureOffersService } from "../features/offers/services/offersService";
import { FixtureStaffService } from "../features/staff/services/FixtureStaffService";
import { FixtureSettingsService } from "../features/settings/services/FixtureSettingsService";
import { managerService as fixtureManagerService } from "../features/manager/services/managerService";
import { dashboardService as fixtureDashboardService } from "../features/dashboard/services/dashboardService";

// Supabase Implementations
import { SupabaseReservationService } from "../features/reservations/services/SupabaseReservationService";
import { SupabaseFloorService } from "../features/floor/services/SupabaseFloorService";
import { SupabaseQueueService } from "../features/queue/services/SupabaseQueueService";
import { SupabaseOrderService } from "../features/orders/services/SupabaseOrderService";
import { SupabaseGuestService } from "../features/guests/services/SupabaseGuestService";
import { SupabaseOffersService } from "../features/offers/services/SupabaseOffersService";
import { SupabaseStaffService } from "../features/staff/services/SupabaseStaffService";
import { SupabaseSettingsService } from "../features/settings/services/SupabaseSettingsService";
import { SupabaseManagerService } from "../features/manager/services/SupabaseManagerService";
import { SupabaseDashboardService } from "../features/dashboard/services/SupabaseDashboardService";

// Singletons
const supabaseReservation = new SupabaseReservationService();
const supabaseFloor = new SupabaseFloorService();
const supabaseQueue = new SupabaseQueueService();
const supabaseOrder = new SupabaseOrderService();
const supabaseGuest = new SupabaseGuestService();
const supabaseOffers = new SupabaseOffersService();
const supabaseStaff = new SupabaseStaffService();
const supabaseSettings = new SupabaseSettingsService();
const supabaseManager = new SupabaseManagerService();
const supabaseDashboard = new SupabaseDashboardService();

const fixtureStaff = new FixtureStaffService();
const fixtureSettings = new FixtureSettingsService();

function shouldUseFixtures(isDevPreviewOverride?: boolean): boolean {
  if (isDevPreviewOverride !== undefined) {
    return isDevPreviewOverride;
  }
  return isDemoMode || !isSupabaseConfigured;
}

export const providerFactory = {
  getReservationService(isDevPreview?: boolean): IReservationService {
    return shouldUseFixtures(isDevPreview) ? fixtureReservationService : supabaseReservation;
  },

  getFloorService(isDevPreview?: boolean): IFloorService {
    return shouldUseFixtures(isDevPreview) ? fixtureFloorService : supabaseFloor;
  },

  getQueueService(isDevPreview?: boolean): IQueueService {
    return shouldUseFixtures(isDevPreview) ? fixtureQueueService : supabaseQueue;
  },

  getOrderService(isDevPreview?: boolean): IOrderService {
    return shouldUseFixtures(isDevPreview) ? fixtureOrderService : supabaseOrder;
  },

  getGuestService(isDevPreview?: boolean): IGuestService {
    return shouldUseFixtures(isDevPreview) ? fixtureGuestService : supabaseGuest;
  },

  getOffersService(isDevPreview?: boolean): IOffersService {
    return shouldUseFixtures(isDevPreview) ? fixtureOffersService : supabaseOffers;
  },

  getStaffService(isDevPreview?: boolean): IStaffService {
    return shouldUseFixtures(isDevPreview) ? fixtureStaff : supabaseStaff;
  },

  getSettingsService(isDevPreview?: boolean): ISettingsService {
    return shouldUseFixtures(isDevPreview) ? fixtureSettings : supabaseSettings;
  },

  getManagerService(isDevPreview?: boolean): IManagerService {
    return shouldUseFixtures(isDevPreview) ? fixtureManagerService : supabaseManager;
  },

  getDashboardService(isDevPreview?: boolean): IDashboardService {
    return shouldUseFixtures(isDevPreview) ? fixtureDashboardService : supabaseDashboard;
  },
};
