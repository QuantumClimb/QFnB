import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { OutletSettings, RestaurantSettings, ServiceSettings, ReservationSettings, FloorSettings, QueueSettings, OrderSettings, GuestSettings, HotelSettings } from "../types";
import type { ISettingsService } from "../services/ISettingsService";
import { FixtureSettingsService } from "../services/FixtureSettingsService";
import { useOrg } from "../../../context/OrgContext";

const fixtureService: ISettingsService = new FixtureSettingsService();

export type SettingsSection =
  | "restaurant"
  | "service"
  | "reservations"
  | "floor"
  | "queue"
  | "orders"
  | "guests"
  | "hotel"
  | "system";

interface SettingsContextType {
  settings: OutletSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  activeSection: SettingsSection;
  setActiveSection: (section: SettingsSection) => void;
  updateRestaurant: (partial: Partial<RestaurantSettings>) => Promise<void>;
  updateService: (partial: Partial<ServiceSettings>) => Promise<void>;
  updateReservations: (partial: Partial<ReservationSettings>) => Promise<void>;
  updateFloor: (partial: Partial<FloorSettings>) => Promise<void>;
  updateQueue: (partial: Partial<QueueSettings>) => Promise<void>;
  updateOrders: (partial: Partial<OrderSettings>) => Promise<void>;
  updateGuests: (partial: Partial<GuestSettings>) => Promise<void>;
  updateHotel: (partial: Partial<HotelSettings>) => Promise<void>;
  refresh: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const { currentOutlet } = useOrg();
  const [settings, setSettings] = useState<OutletSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SettingsSection>("restaurant");

  const outletId = currentOutlet?.id ?? "dev-outlet-001";

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fixtureService.getOutletSettings(outletId);
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  }, [outletId]);

  useEffect(() => { load(); }, [load]);

  async function withSave<T>(fn: () => Promise<T>, onDone: (v: T) => void) {
    setIsSaving(true);
    try {
      const result = await fn();
      onDone(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  const updateRestaurant = (p: Partial<RestaurantSettings>) =>
    withSave(() => fixtureService.updateRestaurantSettings(outletId, p),
      (v) => setSettings((s) => s ? { ...s, restaurant: v } : s));

  const updateService = (p: Partial<ServiceSettings>) =>
    withSave(() => fixtureService.updateServiceSettings(outletId, p),
      (v) => setSettings((s) => s ? { ...s, service: v } : s));

  const updateReservations = (p: Partial<ReservationSettings>) =>
    withSave(() => fixtureService.updateReservationSettings(outletId, p),
      (v) => setSettings((s) => s ? { ...s, reservations: v } : s));

  const updateFloor = (p: Partial<FloorSettings>) =>
    withSave(() => fixtureService.updateFloorSettings(outletId, p),
      (v) => setSettings((s) => s ? { ...s, floor: v } : s));

  const updateQueue = (p: Partial<QueueSettings>) =>
    withSave(() => fixtureService.updateQueueSettings(outletId, p),
      (v) => setSettings((s) => s ? { ...s, queue: v } : s));

  const updateOrders = (p: Partial<OrderSettings>) =>
    withSave(() => fixtureService.updateOrderSettings(outletId, p),
      (v) => setSettings((s) => s ? { ...s, orders: v } : s));

  const updateGuests = (p: Partial<GuestSettings>) =>
    withSave(() => fixtureService.updateGuestSettings(outletId, p),
      (v) => setSettings((s) => s ? { ...s, guests: v } : s));

  const updateHotel = (p: Partial<HotelSettings>) =>
    withSave(() => fixtureService.updateHotelSettings(outletId, p),
      (v) => setSettings((s) => s ? { ...s, hotel: v } : s));

  return (
    <SettingsContext.Provider value={{
      settings,
      isLoading,
      isSaving,
      error,
      activeSection,
      setActiveSection,
      updateRestaurant,
      updateService,
      updateReservations,
      updateFloor,
      updateQueue,
      updateOrders,
      updateGuests,
      updateHotel,
      refresh: load,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
}
