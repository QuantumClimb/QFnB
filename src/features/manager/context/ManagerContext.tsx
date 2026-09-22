import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ManagerSnapshot, ManagerViewMode } from "../types";
import { managerService, IManagerService } from "../services/managerService";
import { useOrg } from "../../../context/OrgContext";

interface ManagerContextType {
  viewMode: ManagerViewMode;
  setViewMode: (mode: ManagerViewMode) => void;
  snapshot: ManagerSnapshot | null;
  isLoading: boolean;
  error: string | null;
  refreshSnapshot: () => Promise<void>;
}

const ManagerContext = createContext<ManagerContextType | undefined>(undefined);

export function ManagerProvider({
  children,
  customService,
}: {
  children: React.ReactNode;
  customService?: IManagerService;
}) {
  const service = customService || managerService;
  const { currentOutlet, currentOrg } = useOrg();

  const [viewMode, setViewMode] = useState<ManagerViewMode>("LIVE_SERVICE");
  const [snapshot, setSnapshot] = useState<ManagerSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSnapshot = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await service.getLiveSnapshot(currentOutlet?.id, currentOrg?.id);
      setSnapshot(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load manager snapshot";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [currentOutlet?.id, currentOrg?.id, service]);

  useEffect(() => {
    refreshSnapshot();
  }, [refreshSnapshot]);

  return (
    <ManagerContext.Provider
      value={{
        viewMode,
        setViewMode,
        snapshot,
        isLoading,
        error,
        refreshSnapshot,
      }}
    >
      {children}
    </ManagerContext.Provider>
  );
}

export function useManager(): ManagerContextType {
  const context = useContext(ManagerContext);
  if (!context) {
    throw new Error("useManager must be used within a ManagerProvider");
  }
  return context;
}
