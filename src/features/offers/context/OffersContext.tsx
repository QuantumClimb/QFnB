import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  Experience,
  ExperienceStatus,
  ExperienceAddon,
  Offer,
  OfferStatus,
  ReservationExperience,
  ReservationExperienceStatus,
  ReservationAddon,
  OffersFilterOptions,
  OffersSummaryMetrics,
  OffersTab,
  CreateExperienceInput,
  UpdateExperienceInput,
  CreateAddonInput,
  UpdateAddonInput,
  CreateOfferInput,
  UpdateOfferInput,
  AttachExperienceInput,
  AttachAddonInput,
  ExperienceCompatibilityResult
} from "../types";
import { offersService, IOffersService } from "../services/offersService";
import { useOrg } from "../../../context/OrgContext";

interface OffersContextType {
  activeTab: OffersTab;
  setActiveTab: (tab: OffersTab) => void;

  experiences: Experience[];
  offers: Offer[];
  addons: ExperienceAddon[];
  reservationExperiences: ReservationExperience[];
  reservationAddons: ReservationAddon[];
  summary: OffersSummaryMetrics | null;

  isLoading: boolean;
  error: string | null;

  filterOptions: OffersFilterOptions;
  setFilterOptions: React.Dispatch<React.SetStateAction<OffersFilterOptions>>;

  selectedExperience: Experience | null;
  selectedOffer: Offer | null;

  isDetailDrawerOpen: boolean;
  openExperienceDetail: (exp: Experience) => Promise<void>;
  closeExperienceDetail: () => void;

  // Modals
  isCreateExpModalOpen: boolean;
  openCreateExpModal: () => void;
  closeCreateExpModal: () => void;

  isEditExpModalOpen: boolean;
  openEditExpModal: (exp?: Experience) => void;
  closeEditExpModal: () => void;

  isCreateOfferModalOpen: boolean;
  openCreateOfferModal: () => void;
  closeCreateOfferModal: () => void;

  isCreateAddonModalOpen: boolean;
  openCreateAddonModal: () => void;
  closeCreateAddonModal: () => void;

  isAttachExpModalOpen: boolean;
  attachExpTarget: Experience | null;
  openAttachExpModal: (experience?: Experience) => void;
  closeAttachExpModal: () => void;

  isAttachAddonModalOpen: boolean;
  attachAddonTargetResId: string | null;
  openAttachAddonModal: (reservationId?: string) => void;
  closeAttachAddonModal: () => void;

  // Operations
  createExperience: (input: CreateExperienceInput) => Promise<Experience>;
  updateExperience: (id: string, input: UpdateExperienceInput) => Promise<Experience>;
  changeExperienceStatus: (id: string, status: ExperienceStatus) => Promise<Experience>;

  createOffer: (input: CreateOfferInput) => Promise<Offer>;
  updateOffer: (id: string, input: UpdateOfferInput) => Promise<Offer>;
  changeOfferStatus: (id: string, status: OfferStatus) => Promise<Offer>;

  createAddon: (input: CreateAddonInput) => Promise<ExperienceAddon>;
  updateAddon: (id: string, input: UpdateAddonInput) => Promise<ExperienceAddon>;

  checkCompatibility: (
    experienceId: string,
    reservation: { party_size: number; reservation_date: string; reservation_time: string; outlet_id: string }
  ) => Promise<ExperienceCompatibilityResult>;

  attachExperienceToReservation: (input: AttachExperienceInput) => Promise<ReservationExperience>;
  removeExperienceFromReservation: (linkId: string) => Promise<void>;
  updateReservationExperienceStatus: (linkId: string, status: ReservationExperienceStatus) => Promise<ReservationExperience>;

  attachAddonToReservation: (input: AttachAddonInput) => Promise<ReservationAddon>;
  removeAddonFromReservation: (linkId: string) => Promise<void>;

  refreshData: () => Promise<void>;
}

const OffersContext = createContext<OffersContextType | undefined>(undefined);

export function OffersProvider({
  children,
  customService
}: {
  children: React.ReactNode;
  customService?: IOffersService;
}) {
  const service = customService || offersService;
  const { currentOrg, currentOutlet } = useOrg();

  const [activeTab, setActiveTab] = useState<OffersTab>("EXPERIENCES");

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [addons, setAddons] = useState<ExperienceAddon[]>([]);
  const [reservationExperiences, setReservationExperiences] = useState<ReservationExperience[]>([]);
  const [reservationAddons, setReservationAddons] = useState<ReservationAddon[]>([]);
  const [summary, setSummary] = useState<OffersSummaryMetrics | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filterOptions, setFilterOptions] = useState<OffersFilterOptions>({
    category: "ALL",
    status: "ALL",
    visibility: "ALL",
    scope: "ALL",
    searchQuery: "",
  });

  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isCreateExpModalOpen, setIsCreateExpModalOpen] = useState(false);
  const [isEditExpModalOpen, setIsEditExpModalOpen] = useState(false);
  const [isCreateOfferModalOpen, setIsCreateOfferModalOpen] = useState(false);
  const [isCreateAddonModalOpen, setIsCreateAddonModalOpen] = useState(false);
  const [isAttachExpModalOpen, setIsAttachExpModalOpen] = useState(false);
  const [attachExpTarget, setAttachExpTarget] = useState<Experience | null>(null);
  const [isAttachAddonModalOpen, setIsAttachAddonModalOpen] = useState(false);
  const [attachAddonTargetResId, setAttachAddonTargetResId] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const orgId = currentOrg?.id;
      const outletId = currentOutlet?.id;

      const [exps, offs, ads, resExps, resAds, metrics] = await Promise.all([
        service.listExperiences(orgId, outletId, filterOptions),
        service.listOffers(orgId, outletId, filterOptions),
        service.listAddons(orgId, outletId),
        service.getAllReservationExperiences(orgId, outletId),
        service.getAllReservationAddons(orgId, outletId),
        service.getSummaryMetrics(orgId, outletId),
      ]);

      setExperiences(exps);
      setOffers(offs);
      setAddons(ads);
      setReservationExperiences(resExps);
      setReservationAddons(resAds);
      setSummary(metrics);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load offers data";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg?.id, currentOutlet?.id, filterOptions, service]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const openExperienceDetail = async (exp: Experience) => {
    const full = await service.getExperience(exp.id);
    setSelectedExperience(full || exp);
    setIsDetailDrawerOpen(true);
  };

  const closeExperienceDetail = () => {
    setIsDetailDrawerOpen(false);
    setSelectedExperience(null);
  };

  const openCreateExpModal = () => setIsCreateExpModalOpen(true);
  const closeCreateExpModal = () => setIsCreateExpModalOpen(false);

  const openEditExpModal = (exp?: Experience) => {
    if (exp) setSelectedExperience(exp);
    setIsEditExpModalOpen(true);
  };
  const closeEditExpModal = () => setIsEditExpModalOpen(false);

  const openCreateOfferModal = () => setIsCreateOfferModalOpen(true);
  const closeCreateOfferModal = () => setIsCreateOfferModalOpen(false);

  const openCreateAddonModal = () => setIsCreateAddonModalOpen(true);
  const closeCreateAddonModal = () => setIsCreateAddonModalOpen(false);

  const openAttachExpModal = (exp?: Experience) => {
    setAttachExpTarget(exp || selectedExperience || null);
    setIsAttachExpModalOpen(true);
  };
  const closeAttachExpModal = () => {
    setIsAttachExpModalOpen(false);
    setAttachExpTarget(null);
  };

  const openAttachAddonModal = (reservationId?: string) => {
    setAttachAddonTargetResId(reservationId || null);
    setIsAttachAddonModalOpen(true);
  };
  const closeAttachAddonModal = () => {
    setIsAttachAddonModalOpen(false);
    setAttachAddonTargetResId(null);
  };

  const createExperience = async (input: CreateExperienceInput): Promise<Experience> => {
    const created = await service.createExperience(input);
    await refreshData();
    return created;
  };

  const updateExperience = async (id: string, input: UpdateExperienceInput): Promise<Experience> => {
    const updated = await service.updateExperience(id, input);
    if (selectedExperience?.id === id) {
      setSelectedExperience(updated);
    }
    await refreshData();
    return updated;
  };

  const changeExperienceStatus = async (id: string, status: ExperienceStatus): Promise<Experience> => {
    const updated = await service.changeExperienceStatus(id, status);
    if (selectedExperience?.id === id) {
      setSelectedExperience(updated);
    }
    await refreshData();
    return updated;
  };

  const createOffer = async (input: CreateOfferInput): Promise<Offer> => {
    const created = await service.createOffer(input);
    await refreshData();
    return created;
  };

  const updateOffer = async (id: string, input: UpdateOfferInput): Promise<Offer> => {
    const updated = await service.updateOffer(id, input);
    await refreshData();
    return updated;
  };

  const changeOfferStatus = async (id: string, status: OfferStatus): Promise<Offer> => {
    const updated = await service.changeOfferStatus(id, status);
    await refreshData();
    return updated;
  };

  const createAddon = async (input: CreateAddonInput): Promise<ExperienceAddon> => {
    const created = await service.createAddon(input);
    await refreshData();
    return created;
  };

  const updateAddon = async (id: string, input: UpdateAddonInput): Promise<ExperienceAddon> => {
    const updated = await service.updateAddon(id, input);
    await refreshData();
    return updated;
  };

  const checkCompatibility = async (
    experienceId: string,
    reservation: { party_size: number; reservation_date: string; reservation_time: string; outlet_id: string }
  ): Promise<ExperienceCompatibilityResult> => {
    return service.checkExperienceCompatibility(experienceId, reservation);
  };

  const attachExperienceToReservation = async (input: AttachExperienceInput): Promise<ReservationExperience> => {
    const resExp = await service.attachExperienceToReservation(input);
    await refreshData();
    return resExp;
  };

  const removeExperienceFromReservation = async (linkId: string): Promise<void> => {
    await service.removeExperienceFromReservation(linkId);
    await refreshData();
  };

  const updateReservationExperienceStatus = async (
    linkId: string,
    status: ReservationExperienceStatus
  ): Promise<ReservationExperience> => {
    const updated = await service.updateReservationExperienceStatus(linkId, status);
    await refreshData();
    return updated;
  };

  const attachAddonToReservation = async (input: AttachAddonInput): Promise<ReservationAddon> => {
    const resAddon = await service.attachAddonToReservation(input);
    await refreshData();
    return resAddon;
  };

  const removeAddonFromReservation = async (linkId: string): Promise<void> => {
    await service.removeAddonFromReservation(linkId);
    await refreshData();
  };

  return (
    <OffersContext.Provider
      value={{
        activeTab,
        setActiveTab,
        experiences,
        offers,
        addons,
        reservationExperiences,
        reservationAddons,
        summary,
        isLoading,
        error,
        filterOptions,
        setFilterOptions,
        selectedExperience,
        selectedOffer,
        isDetailDrawerOpen,
        openExperienceDetail,
        closeExperienceDetail,
        isCreateExpModalOpen,
        openCreateExpModal,
        closeCreateExpModal,
        isEditExpModalOpen,
        openEditExpModal,
        closeEditExpModal,
        isCreateOfferModalOpen,
        openCreateOfferModal,
        closeCreateOfferModal,
        isCreateAddonModalOpen,
        openCreateAddonModal,
        closeCreateAddonModal,
        isAttachExpModalOpen,
        attachExpTarget,
        openAttachExpModal,
        closeAttachExpModal,
        isAttachAddonModalOpen,
        attachAddonTargetResId,
        openAttachAddonModal,
        closeAttachAddonModal,
        createExperience,
        updateExperience,
        changeExperienceStatus,
        createOffer,
        updateOffer,
        changeOfferStatus,
        createAddon,
        updateAddon,
        checkCompatibility,
        attachExperienceToReservation,
        removeExperienceFromReservation,
        updateReservationExperienceStatus,
        attachAddonToReservation,
        removeAddonFromReservation,
        refreshData,
      }}
    >
      {children}
    </OffersContext.Provider>
  );
}

export function useOffers(): OffersContextType {
  const context = useContext(OffersContext);
  if (!context) {
    throw new Error("useOffers must be used within an OffersProvider");
  }
  return context;
}
