import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { DashboardData } from "../types";
import { dashboardService } from "../services/dashboardService";
import { useOrg } from "../../../context/OrgContext";

interface DashboardContextType {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  checkInReservation: (id: string) => Promise<void>;
  notifyWaitlistGuest: (id: string) => Promise<void>;
  seatWaitlistGuest: (id: string, tableNumber: string) => Promise<void>;
  markOrderReady: (id: string) => Promise<void>;
  dismissAlert: (id: string) => Promise<void>;
  addQuickWalkIn: (input: {
    guestName: string;
    partySize: number;
    preferredSection: string;
    tableNumber?: string;
    notes?: string;
  }) => Promise<void>;
  addWaitlistEntry: (input: {
    guestName: string;
    guestPhone: string;
    partySize: number;
    preferredSection: "Main Dining" | "Bar High-Tops" | "Terrace" | "Any";
    quotedTimeMins: number;
    notes?: string;
  }) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { currentOutlet } = useOrg();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await dashboardService.getDashboardData(currentOutlet?.id);
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load live operations data");
    } finally {
      setIsLoading(false);
    }
  }, [currentOutlet?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshData = async () => {
    try {
      const res = await dashboardService.getDashboardData(currentOutlet?.id);
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to refresh live operations data");
    }
  };

  const checkInReservation = async (id: string) => {
    await dashboardService.checkInReservation(id);
    await refreshData();
  };

  const notifyWaitlistGuest = async (id: string) => {
    await dashboardService.notifyWaitlistGuest(id);
    await refreshData();
  };

  const seatWaitlistGuest = async (id: string, tableNumber: string) => {
    await dashboardService.seatWaitlistGuest(id, tableNumber);
    await refreshData();
  };

  const markOrderReady = async (id: string) => {
    await dashboardService.markOrderReady(id);
    await refreshData();
  };

  const dismissAlert = async (id: string) => {
    await dashboardService.dismissAlert(id);
    await refreshData();
  };

  const addQuickWalkIn = async (input: {
    guestName: string;
    partySize: number;
    preferredSection: string;
    tableNumber?: string;
    notes?: string;
  }) => {
    await dashboardService.addQuickWalkIn(input);
    await refreshData();
  };

  const addWaitlistEntry = async (input: {
    guestName: string;
    guestPhone: string;
    partySize: number;
    preferredSection: "Main Dining" | "Bar High-Tops" | "Terrace" | "Any";
    quotedTimeMins: number;
    notes?: string;
  }) => {
    await dashboardService.addWaitlistEntry(input);
    await refreshData();
  };

  return (
    <DashboardContext.Provider
      value={{
        data,
        isLoading,
        error,
        refreshData,
        checkInReservation,
        notifyWaitlistGuest,
        seatWaitlistGuest,
        markOrderReady,
        dismissAlert,
        addQuickWalkIn,
        addWaitlistEntry,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
