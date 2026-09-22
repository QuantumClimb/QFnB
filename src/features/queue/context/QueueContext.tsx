import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { 
  WaitlistEntry, 
  WaitlistStatus, 
  QueueSummary, 
  AddWaitlistEntryInput, 
  UpdateWaitlistEntryInput, 
  SeatFromQueueInput, 
  NotificationChannel,
  NotificationDispatchResult
} from "../types";
import { queueService, IQueueService } from "../services/queueService";
import { guestNotificationService, IGuestNotificationService } from "../services/guestNotificationService";
import { useOrg } from "../../../context/OrgContext";

interface QueueContextType {
  entries: WaitlistEntry[];
  summary: QueueSummary | null;
  isLoading: boolean;
  
  // Filters & Search
  statusFilter: string;
  areaFilter: string;
  searchQuery: string;
  setStatusFilter: (status: string) => void;
  setAreaFilter: (areaId: string) => void;
  setSearchQuery: (query: string) => void;

  // Modals & Drawer State
  selectedEntry: WaitlistEntry | null;
  activeActionEntry: WaitlistEntry | null;
  isAddModalOpen: boolean;
  isSeatModalOpen: boolean;
  isNotifyModalOpen: boolean;
  isDrawerOpen: boolean;
  toastMessage: string | null;

  // Actions
  refreshQueue: () => Promise<void>;
  addEntry: (input: AddWaitlistEntryInput) => Promise<WaitlistEntry>;
  updateEntry: (entryId: string, input: UpdateWaitlistEntryInput) => Promise<WaitlistEntry>;
  changeStatus: (entryId: string, status: WaitlistStatus, note?: string) => Promise<WaitlistEntry>;
  updateQuotedWait: (entryId: string, minutes: number) => Promise<WaitlistEntry>;
  prepareTable: (entryId: string, tableId: string) => Promise<WaitlistEntry>;
  markTableReady: (entryId: string, tableId?: string) => Promise<WaitlistEntry>;
  seatGuest: (input: SeatFromQueueInput) => Promise<void>;
  cancelEntry: (entryId: string, reason?: string) => Promise<WaitlistEntry>;
  markNoResponse: (entryId: string, note?: string) => Promise<WaitlistEntry>;
  notifyGuest: (entry: WaitlistEntry, channel?: NotificationChannel) => Promise<NotificationDispatchResult>;

  // UI Handlers
  openAddModal: () => void;
  closeAddModal: () => void;
  openSeatModal: (entry: WaitlistEntry) => void;
  closeSeatModal: () => void;
  openNotifyModal: (entry: WaitlistEntry) => void;
  closeNotifyModal: () => void;
  openDrawer: (entry: WaitlistEntry) => void;
  closeDrawer: () => void;
  clearToast: () => void;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export function QueueProvider({ 
  children,
  customQueueService,
  customNotificationService
}: { 
  children: React.ReactNode;
  customQueueService?: IQueueService;
  customNotificationService?: IGuestNotificationService;
}) {
  const { currentOutlet } = useOrg();
  const qService = customQueueService || queueService;
  const nService = customNotificationService || guestNotificationService;

  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [summary, setSummary] = useState<QueueSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);
  const [activeActionEntry, setActiveActionEntry] = useState<WaitlistEntry | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isSeatModalOpen, setIsSeatModalOpen] = useState<boolean>(false);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const refreshQueue = useCallback(async () => {
    try {
      setIsLoading(true);
      const [fetchedEntries, fetchedSummary] = await Promise.all([
        qService.listEntries(currentOutlet?.id, statusFilter),
        qService.getQueueSummary(currentOutlet?.id)
      ]);
      setEntries(fetchedEntries);
      setSummary(fetchedSummary);

      if (selectedEntry) {
        const updatedSelected = fetchedEntries.find((e) => e.id === selectedEntry.id);
        if (updatedSelected) setSelectedEntry(updatedSelected);
      }
    } catch (err) {
      console.error("Failed to load queue data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentOutlet?.id, statusFilter, qService, selectedEntry]);

  useEffect(() => {
    refreshQueue();
  }, [statusFilter, currentOutlet?.id]);

  // Periodic waitlist refresh ticker (every 30 seconds for live wait counters)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshQueue();
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshQueue]);

  const addEntry = async (input: AddWaitlistEntryInput): Promise<WaitlistEntry> => {
    const created = await qService.addEntry(input, currentOutlet?.id);
    await refreshQueue();
    showToast(`Added ${created.guest_name} (${created.queue_number}) to waitlist`);
    return created;
  };

  const updateEntry = async (entryId: string, input: UpdateWaitlistEntryInput): Promise<WaitlistEntry> => {
    const updated = await qService.updateEntry(entryId, input);
    await refreshQueue();
    showToast(`Updated entry for ${updated.guest_name}`);
    return updated;
  };

  const changeStatus = async (entryId: string, status: WaitlistStatus, note?: string): Promise<WaitlistEntry> => {
    const updated = await qService.changeStatus(entryId, status, note);
    await refreshQueue();
    showToast(`Status updated to ${status.toUpperCase()} for ${updated.guest_name}`);
    return updated;
  };

  const updateQuotedWait = async (entryId: string, minutes: number): Promise<WaitlistEntry> => {
    const updated = await qService.updateQuotedWait(entryId, minutes);
    await refreshQueue();
    showToast(`Quoted wait updated to ${minutes} min for ${updated.guest_name}`);
    return updated;
  };

  const prepareTable = async (entryId: string, tableId: string): Promise<WaitlistEntry> => {
    const updated = await qService.prepareTable(entryId, tableId);
    await refreshQueue();
    showToast(`Table assigned for ${updated.guest_name}. Table is being prepared.`);
    return updated;
  };

  const markTableReady = async (entryId: string, tableId?: string): Promise<WaitlistEntry> => {
    const updated = await qService.markTableReady(entryId, tableId);
    await refreshQueue();
    showToast(`Table is READY for ${updated.guest_name}! Ready to notify.`);
    return updated;
  };

  const seatGuest = async (input: SeatFromQueueInput): Promise<void> => {
    const result = await qService.seatGuest(input);
    await refreshQueue();
    setIsSeatModalOpen(false);
    setIsDrawerOpen(false);
    showToast(`Successfully seated ${result.entry.guest_name} at Table ${result.table.table_number}!`);
  };

  const cancelEntry = async (entryId: string, reason?: string): Promise<WaitlistEntry> => {
    const updated = await qService.cancelEntry(entryId, reason);
    await refreshQueue();
    showToast(`Waitlist entry for ${updated.guest_name} cancelled`);
    return updated;
  };

  const markNoResponse = async (entryId: string, note?: string): Promise<WaitlistEntry> => {
    const updated = await qService.markNoResponse(entryId, note);
    await refreshQueue();
    showToast(`Marked ${updated.guest_name} as NO RESPONSE`);
    return updated;
  };

  const notifyGuest = async (entry: WaitlistEntry, channel: NotificationChannel = "whatsapp"): Promise<NotificationDispatchResult> => {
    const tableNum = entry.assigned_table_number || "Host Desk";
    const result = await nService.notifyTableReady(entry, tableNum, channel);
    await qService.changeStatus(entry.id, "notified", `Dispatched ${channel.toUpperCase()} notification`);
    await refreshQueue();
    showToast(`Simulated ${channel.toUpperCase()} dispatched to ${entry.phone}`);
    return result;
  };

  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => setIsAddModalOpen(false);

  const openSeatModal = (entry: WaitlistEntry) => {
    setActiveActionEntry(entry);
    setIsSeatModalOpen(true);
  };
  const closeSeatModal = () => {
    setActiveActionEntry(null);
    setIsSeatModalOpen(false);
  };

  const openNotifyModal = (entry: WaitlistEntry) => {
    setActiveActionEntry(entry);
    setIsNotifyModalOpen(true);
  };
  const closeNotifyModal = () => {
    setActiveActionEntry(null);
    setIsNotifyModalOpen(false);
  };

  const openDrawer = (entry: WaitlistEntry) => {
    setSelectedEntry(entry);
    setIsDrawerOpen(true);
  };
  const closeDrawer = () => {
    setSelectedEntry(null);
    setIsDrawerOpen(false);
  };

  const clearToast = () => setToastMessage(null);

  // Filter entries in memory by area and search query
  const filteredEntries = entries.filter((e) => {
    if (areaFilter !== "all" && e.preferred_seating_area_id && e.preferred_seating_area_id !== areaFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = e.guest_name.toLowerCase().includes(q);
      const matchPhone = e.phone.toLowerCase().includes(q);
      const matchQueueNum = e.queue_number.toLowerCase().includes(q);
      return matchName || matchPhone || matchQueueNum;
    }
    return true;
  });

  return (
    <QueueContext.Provider
      value={{
        entries: filteredEntries,
        summary,
        isLoading,
        statusFilter,
        areaFilter,
        searchQuery,
        setStatusFilter,
        setAreaFilter,
        setSearchQuery,
        selectedEntry,
        activeActionEntry,
        isAddModalOpen,
        isSeatModalOpen,
        isNotifyModalOpen,
        isDrawerOpen,
        toastMessage,
        refreshQueue,
        addEntry,
        updateEntry,
        changeStatus,
        updateQuotedWait,
        prepareTable,
        markTableReady,
        seatGuest,
        cancelEntry,
        markNoResponse,
        notifyGuest,
        openAddModal,
        closeAddModal,
        openSeatModal,
        closeSeatModal,
        openNotifyModal,
        closeNotifyModal,
        openDrawer,
        closeDrawer,
        clearToast,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue(): QueueContextType {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error("useQueue must be used within a QueueProvider");
  }
  return context;
}
