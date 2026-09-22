import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  Guest,
  GuestVisit,
  CreateGuestInput,
  UpdateGuestInput,
  GuestFilterOptions,
  GuestSummaryMetrics,
  DuplicateMatchResult,
  GuestUpcomingReservationPreview,
  GuestRecentOrderPreview,
  GuestViewMode
} from "../types";
import { guestService, IGuestService } from "../services/guestService";

interface GuestContextType {
  guests: Guest[];
  summary: GuestSummaryMetrics | null;
  isLoading: boolean;
  error: string | null;
  selectedGuest: Guest | null;
  guestVisits: GuestVisit[];
  upcomingReservations: GuestUpcomingReservationPreview[];
  recentOrders: GuestRecentOrderPreview[];
  filterOptions: GuestFilterOptions;
  setFilterOptions: React.Dispatch<React.SetStateAction<GuestFilterOptions>>;
  setViewMode: (mode: GuestViewMode) => void;
  isDetailDrawerOpen: boolean;
  openGuestDetail: (guest: Guest) => Promise<void>;
  closeGuestDetail: () => void;
  isCreateModalOpen: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  isEditModalOpen: boolean;
  openEditModal: (guest?: Guest) => void;
  closeEditModal: () => void;
  createGuest: (input: CreateGuestInput) => Promise<Guest>;
  updateGuest: (guestId: string, input: UpdateGuestInput) => Promise<Guest>;
  addTag: (guestId: string, tag: string) => Promise<void>;
  removeTag: (guestId: string, tag: string) => Promise<void>;
  addHospitalityNote: (guestId: string, note: string) => Promise<void>;
  checkDuplicate: (phone?: string, email?: string, whatsapp?: string) => Promise<DuplicateMatchResult>;
  refreshGuests: () => Promise<void>;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export function GuestProvider({ 
  children, 
  customService 
}: { 
  children: React.ReactNode; 
  customService?: IGuestService;
}) {
  const service = customService || guestService;

  const [guests, setGuests] = useState<Guest[]>([]);
  const [summary, setSummary] = useState<GuestSummaryMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filterOptions, setFilterOptions] = useState<GuestFilterOptions>({
    viewMode: "ALL",
    searchQuery: "",
    tag: "ALL",
    sortBy: "last_visit",
    sortDirection: "desc",
  });

  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [guestVisits, setGuestVisits] = useState<GuestVisit[]>([]);
  const [upcomingReservations, setUpcomingReservations] = useState<GuestUpcomingReservationPreview[]>([]);
  const [recentOrders, setRecentOrders] = useState<GuestRecentOrderPreview[]>([]);

  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [list, sum] = await Promise.all([
        service.listGuests("org-001", filterOptions),
        service.getGuestSummary("org-001"),
      ]);
      setGuests(list);
      setSummary(sum);
    } catch (err) {
      console.error("Failed to load guests data:", err);
      setError(err instanceof Error ? err.message : "Failed to load guests");
    } finally {
      setIsLoading(false);
    }
  }, [service, filterOptions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const setViewMode = (mode: GuestViewMode) => {
    setFilterOptions((prev) => ({ ...prev, viewMode: mode }));
  };

  const openGuestDetail = async (guest: Guest) => {
    setSelectedGuest(guest);
    setIsDetailDrawerOpen(true);

    try {
      const [visits, upcomings, orders] = await Promise.all([
        service.getGuestVisits(guest.id),
        service.getUpcomingReservations(guest.id),
        service.getRecentOrders(guest.id),
      ]);
      setGuestVisits(visits);
      setUpcomingReservations(upcomings);
      setRecentOrders(orders);
    } catch (err) {
      console.error("Failed to load guest detail timeline:", err);
    }
  };

  const closeGuestDetail = () => {
    setIsDetailDrawerOpen(false);
  };

  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => setIsCreateModalOpen(false);

  const openEditModal = (guest?: Guest) => {
    if (guest) setSelectedGuest(guest);
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => setIsEditModalOpen(false);

  const createGuest = async (input: CreateGuestInput): Promise<Guest> => {
    const created = await service.createGuest(input);
    await loadData();
    setIsCreateModalOpen(false);
    return created;
  };

  const updateGuest = async (guestId: string, input: UpdateGuestInput): Promise<Guest> => {
    const updated = await service.updateGuest(guestId, input);
    if (selectedGuest && selectedGuest.id === guestId) {
      setSelectedGuest(updated);
    }
    await loadData();
    setIsEditModalOpen(false);
    return updated;
  };

  const addTag = async (guestId: string, tag: string) => {
    const updated = await service.addTag(guestId, tag);
    if (selectedGuest && selectedGuest.id === guestId) {
      setSelectedGuest(updated);
    }
    await loadData();
  };

  const removeTag = async (guestId: string, tag: string) => {
    const updated = await service.removeTag(guestId, tag);
    if (selectedGuest && selectedGuest.id === guestId) {
      setSelectedGuest(updated);
    }
    await loadData();
  };

  const addHospitalityNote = async (guestId: string, note: string) => {
    const updated = await service.addHospitalityNote(guestId, note);
    if (selectedGuest && selectedGuest.id === guestId) {
      setSelectedGuest(updated);
    }
    await loadData();
  };

  const checkDuplicate = async (
    phone?: string,
    email?: string,
    whatsapp?: string
  ): Promise<DuplicateMatchResult> => {
    return service.findPotentialMatches(phone, email, whatsapp);
  };

  return (
    <GuestContext.Provider
      value={{
        guests,
        summary,
        isLoading,
        error,
        selectedGuest,
        guestVisits,
        upcomingReservations,
        recentOrders,
        filterOptions,
        setFilterOptions,
        setViewMode,
        isDetailDrawerOpen,
        openGuestDetail,
        closeGuestDetail,
        isCreateModalOpen,
        openCreateModal,
        closeCreateModal,
        isEditModalOpen,
        openEditModal,
        closeEditModal,
        createGuest,
        updateGuest,
        addTag,
        removeTag,
        addHospitalityNote,
        checkDuplicate,
        refreshGuests: loadData,
      }}
    >
      {children}
    </GuestContext.Provider>
  );
}

export function useGuests() {
  const ctx = useContext(GuestContext);
  if (!ctx) {
    throw new Error("useGuests must be used within a GuestProvider");
  }
  return ctx;
}
