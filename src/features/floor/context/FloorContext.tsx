import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { 
  RestaurantTable, 
  TableStatus, 
  FloorSeatingArea, 
  FloorSummary,
  SmartAvailabilityWindow,
  SmartAvailabilityQuery,
  SeatReservationInput,
  SeatWalkInInput
} from "../types";
import { floorService } from "../services/floorService";
import { smartAvailabilityService } from "../services/smartAvailabilityService";
import { useOrg } from "../../../context/OrgContext";

interface FloorContextType {
  tables: RestaurantTable[];
  areas: FloorSeatingArea[];
  selectedAreaId: string;
  setSelectedAreaId: (id: string) => void;
  selectedTable: RestaurantTable | null;
  setSelectedTable: (t: RestaurantTable | null) => void;
  floorSummary: FloorSummary | null;
  smartWindows: SmartAvailabilityWindow[];
  isLoading: boolean;
  error: string | null;
  refreshFloor: () => Promise<void>;
  changeTableStatus: (tableId: string, status: TableStatus, note?: string) => Promise<void>;
  seatReservation: (tableId: string, reservationId: string, guestData: SeatReservationInput) => Promise<void>;
  seatWalkIn: (tableId: string, guestData: SeatWalkInInput) => Promise<void>;
  moveParty: (fromTableId: string, toTableId: string) => Promise<void>;
  markCleaning: (tableId: string) => Promise<void>;
  markAvailable: (tableId: string) => Promise<void>;
  blockTable: (tableId: string, reason?: string) => Promise<void>;
  activeModal: "seat_reservation" | "seat_walkin" | "move_guest" | "smart_availability" | null;
  setActiveModal: (m: "seat_reservation" | "seat_walkin" | "move_guest" | "smart_availability" | null) => void;
  modalTargetTable: RestaurantTable | null;
  setModalTargetTable: (t: RestaurantTable | null) => void;
  evaluateSmartWindows: (query?: Partial<SmartAvailabilityQuery>) => Promise<void>;
}

const FloorContext = createContext<FloorContextType | undefined>(undefined);

export function FloorProvider({ children }: { children: React.ReactNode }) {
  const { currentOutlet } = useOrg();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [areas, setAreas] = useState<FloorSeatingArea[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>("all");
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [floorSummary, setFloorSummary] = useState<FloorSummary | null>(null);
  const [smartWindows, setSmartWindows] = useState<SmartAvailabilityWindow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activeModal, setActiveModal] = useState<"seat_reservation" | "seat_walkin" | "move_guest" | "smart_availability" | null>(null);
  const [modalTargetTable, setModalTargetTable] = useState<RestaurantTable | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [areasRes, tablesRes, summaryRes] = await Promise.all([
        floorService.listSeatingAreas(currentOutlet?.id),
        floorService.listTables(currentOutlet?.id, selectedAreaId),
        floorService.getFloorSummary(currentOutlet?.id),
      ]);

      setAreas(areasRes);
      setTables(tablesRes);
      setFloorSummary(summaryRes);

      if (selectedTable) {
        const updated = tablesRes.find((t) => t.id === selectedTable.id);
        if (updated) setSelectedTable(updated);
      }

      const windows = await smartAvailabilityService.findWindows(
        { party_size: 2, preferred_area_id: selectedAreaId, current_time: "19:30" },
        tablesRes
      );
      setSmartWindows(windows);
    } catch (err: any) {
      setError(err?.message || "Failed to load floor matrix data");
    } finally {
      setIsLoading(false);
    }
  }, [currentOutlet?.id, selectedAreaId, selectedTable?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshFloor = async () => {
    try {
      const [areasRes, tablesRes, summaryRes] = await Promise.all([
        floorService.listSeatingAreas(currentOutlet?.id),
        floorService.listTables(currentOutlet?.id, selectedAreaId),
        floorService.getFloorSummary(currentOutlet?.id),
      ]);

      setAreas(areasRes);
      setTables(tablesRes);
      setFloorSummary(summaryRes);

      if (selectedTable) {
        const updated = tablesRes.find((t) => t.id === selectedTable.id);
        if (updated) setSelectedTable(updated);
      }

      const windows = await smartAvailabilityService.findWindows(
        { party_size: 2, preferred_area_id: selectedAreaId, current_time: "19:30" },
        tablesRes
      );
      setSmartWindows(windows);
    } catch (err: any) {
      setError(err?.message || "Failed to refresh floor data");
    }
  };

  const evaluateSmartWindows = async (query?: Partial<SmartAvailabilityQuery>) => {
    try {
      const defaultQuery: SmartAvailabilityQuery = {
        party_size: query?.party_size || 2,
        preferred_area_id: query?.preferred_area_id || selectedAreaId,
        current_time: query?.current_time || "19:30",
        minimum_duration_minutes: query?.minimum_duration_minutes || 75,
        cleaning_buffer_minutes: query?.cleaning_buffer_minutes || 15,
      };
      const windows = await smartAvailabilityService.findWindows(defaultQuery, tables);
      setSmartWindows(windows);
    } catch (err) {
      console.error("Smart windows calculation failed:", err);
    }
  };

  const changeTableStatus = async (tableId: string, status: TableStatus, note?: string) => {
    await floorService.changeTableStatus(tableId, status, note);
    await refreshFloor();
  };

  const seatReservation = async (tableId: string, reservationId: string, guestData: SeatReservationInput) => {
    await floorService.seatReservation(tableId, reservationId, guestData);
    await refreshFloor();
  };

  const seatWalkIn = async (tableId: string, guestData: SeatWalkInInput) => {
    await floorService.seatWalkIn(tableId, guestData);
    await refreshFloor();
  };

  const moveParty = async (fromTableId: string, toTableId: string) => {
    await floorService.moveParty(fromTableId, toTableId);
    await refreshFloor();
  };

  const markCleaning = async (tableId: string) => {
    await floorService.markCleaning(tableId);
    await refreshFloor();
  };

  const markAvailable = async (tableId: string) => {
    await floorService.markAvailable(tableId);
    await refreshFloor();
  };

  const blockTable = async (tableId: string, reason?: string) => {
    await floorService.blockTable(tableId, reason);
    await refreshFloor();
  };

  return (
    <FloorContext.Provider
      value={{
        tables,
        areas,
        selectedAreaId,
        setSelectedAreaId,
        selectedTable,
        setSelectedTable,
        floorSummary,
        smartWindows,
        isLoading,
        error,
        refreshFloor,
        changeTableStatus,
        seatReservation,
        seatWalkIn,
        moveParty,
        markCleaning,
        markAvailable,
        blockTable,
        activeModal,
        setActiveModal,
        modalTargetTable,
        setModalTargetTable,
        evaluateSmartWindows,
      }}
    >
      {children}
    </FloorContext.Provider>
  );
}

export function useFloor() {
  const context = useContext(FloorContext);
  if (!context) {
    throw new Error("useFloor must be used within a FloorProvider");
  }
  return context;
}
