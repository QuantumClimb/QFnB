import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { 
  Reservation, 
  ReservationStatus, 
  ReservationFilterCriteria, 
  SeatingArea, 
  CreateReservationInput, 
  UpdateReservationInput 
} from "../types";
import { reservationService } from "../services/reservationService";
import { useOrg } from "../../../context/OrgContext";

interface ReservationContextType {
  reservations: Reservation[];
  seatingAreas: SeatingArea[];
  selectedReservation: Reservation | null;
  setSelectedReservation: (r: Reservation | null) => void;
  filters: ReservationFilterCriteria;
  setFilters: React.Dispatch<React.SetStateAction<ReservationFilterCriteria>>;
  updateFilter: (key: keyof ReservationFilterCriteria, value: any) => void;
  isLoading: boolean;
  error: string | null;
  refreshReservations: () => Promise<void>;
  createReservation: (input: CreateReservationInput) => Promise<Reservation>;
  updateReservation: (id: string, input: UpdateReservationInput) => Promise<Reservation>;
  changeStatus: (id: string, status: ReservationStatus, note?: string) => Promise<Reservation>;
  cancelReservation: (id: string, reason?: string) => Promise<Reservation>;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
}

const defaultFilters: ReservationFilterCriteria = {
  viewMode: "today",
  searchQuery: "",
  date: "2026-09-19",
  status: "all",
  seatingAreaId: "all",
  bookingSource: "all",
};

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export function ReservationProvider({ children }: { children: React.ReactNode }) {
  const { currentOutlet, currentOrg } = useOrg();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [seatingAreas, setSeatingAreas] = useState<SeatingArea[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [filters, setFilters] = useState<ReservationFilterCriteria>(defaultFilters);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const loadAreas = useCallback(async () => {
    try {
      const areas = await reservationService.getSeatingAreas(currentOutlet?.id);
      setSeatingAreas(areas);
    } catch (err: any) {
      console.error("Failed to load seating areas:", err);
    }
  }, [currentOutlet?.id]);

  const loadReservations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await reservationService.listReservations(filters, currentOutlet?.id);
      setReservations(data);

      // If selected reservation exists, refresh its snapshot
      if (selectedReservation) {
        const updatedSelected = data.find((r) => r.id === selectedReservation.id);
        if (updatedSelected) {
          setSelectedReservation(updatedSelected);
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load reservations list");
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentOutlet?.id, selectedReservation?.id]);

  useEffect(() => {
    loadAreas();
  }, [loadAreas]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  const refreshReservations = async () => {
    try {
      const data = await reservationService.listReservations(filters, currentOutlet?.id);
      setReservations(data);
      if (selectedReservation) {
        const updatedSelected = data.find((r) => r.id === selectedReservation.id);
        if (updatedSelected) {
          setSelectedReservation(updatedSelected);
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to refresh reservations");
    }
  };

  const updateFilter = (key: keyof ReservationFilterCriteria, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const createReservation = async (input: CreateReservationInput): Promise<Reservation> => {
    const created = await reservationService.createReservation(
      input, 
      currentOutlet?.id || "out-1", 
      currentOrg?.id || "org-1"
    );
    await refreshReservations();
    return created;
  };

  const updateReservation = async (id: string, input: UpdateReservationInput): Promise<Reservation> => {
    const updated = await reservationService.updateReservation(id, input);
    await refreshReservations();
    if (selectedReservation?.id === id) {
      setSelectedReservation(updated);
    }
    return updated;
  };

  const changeStatus = async (id: string, status: ReservationStatus, note?: string): Promise<Reservation> => {
    const updated = await reservationService.changeStatus(id, status, note);
    await refreshReservations();
    if (selectedReservation?.id === id) {
      setSelectedReservation(updated);
    }
    return updated;
  };

  const cancelReservation = async (id: string, reason?: string): Promise<Reservation> => {
    const updated = await reservationService.cancelReservation(id, reason);
    await refreshReservations();
    if (selectedReservation?.id === id) {
      setSelectedReservation(updated);
    }
    return updated;
  };

  return (
    <ReservationContext.Provider
      value={{
        reservations,
        seatingAreas,
        selectedReservation,
        setSelectedReservation,
        filters,
        setFilters,
        updateFilter,
        isLoading,
        error,
        refreshReservations,
        createReservation,
        updateReservation,
        changeStatus,
        cancelReservation,
        isCreateModalOpen,
        setIsCreateModalOpen,
      }}
    >
      {children}
    </ReservationContext.Provider>
  );
}

export function useReservations() {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error("useReservations must be used within a ReservationProvider");
  }
  return context;
}
