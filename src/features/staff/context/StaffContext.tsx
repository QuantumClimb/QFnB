import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { StaffMember, StaffInvite, StaffViewTab, CreateStaffInviteInput, UpdateStaffRoleInput, AssignOutletInput } from "../types";
import type { IStaffService } from "../services/IStaffService";
import { FixtureStaffService } from "../services/FixtureStaffService";
import { useOrg } from "../../../context/OrgContext";

// Single shared fixture instance
const fixtureService: IStaffService = new FixtureStaffService();

interface StaffContextType {
  staff: StaffMember[];
  invites: StaffInvite[];
  isLoading: boolean;
  error: string | null;
  activeTab: StaffViewTab;
  selectedStaff: StaffMember | null;
  setActiveTab: (tab: StaffViewTab) => void;
  setSelectedStaff: (member: StaffMember | null) => void;
  inviteStaff: (input: CreateStaffInviteInput) => Promise<void>;
  updateRole: (input: UpdateStaffRoleInput) => Promise<void>;
  assignOutlet: (input: AssignOutletInput) => Promise<void>;
  removeOutlet: (staffId: string, outletId: string) => Promise<void>;
  deactivateStaff: (staffId: string) => Promise<void>;
  reactivateStaff: (staffId: string) => Promise<void>;
  cancelInvite: (inviteId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export function StaffProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const { currentOrg, currentOutlet } = useOrg();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [invites, setInvites] = useState<StaffInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StaffViewTab>("ALL_STAFF");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const load = useCallback(async () => {
    if (!currentOrg) return;
    setIsLoading(true);
    setError(null);
    try {
      const [staffData, inviteData] = await Promise.all([
        fixtureService.listStaff(currentOrg.id),
        fixtureService.listInvites(currentOrg.id),
      ]);
      setStaff(staffData);
      setInvites(inviteData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load staff data");
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg]);

  useEffect(() => {
    load();
  }, [load]);

  const inviteStaff = async (input: CreateStaffInviteInput) => {
    await fixtureService.inviteStaff(input);
    await load();
  };

  const updateRole = async (input: UpdateStaffRoleInput) => {
    const updated = await fixtureService.updateRole(input);
    setStaff((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    if (selectedStaff?.id === updated.id) setSelectedStaff(updated);
  };

  const assignOutlet = async (input: AssignOutletInput) => {
    await fixtureService.assignOutlet(input);
    await load();
  };

  const removeOutlet = async (staffId: string, outletId: string) => {
    await fixtureService.removeOutlet({ staffId, outletId });
    await load();
  };

  const deactivateStaff = async (staffId: string) => {
    const updated = await fixtureService.deactivateStaff(staffId);
    setStaff((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    if (selectedStaff?.id === updated.id) setSelectedStaff(updated);
  };

  const reactivateStaff = async (staffId: string) => {
    const updated = await fixtureService.reactivateStaff(staffId);
    setStaff((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    if (selectedStaff?.id === updated.id) setSelectedStaff(updated);
  };

  const cancelInvite = async (inviteId: string) => {
    await fixtureService.cancelInvite(inviteId);
    setInvites((prev) => prev.filter((i) => i.id !== inviteId));
  };

  return (
    <StaffContext.Provider
      value={{
        staff,
        invites,
        isLoading,
        error,
        activeTab,
        selectedStaff,
        setActiveTab,
        setSelectedStaff,
        inviteStaff,
        updateRole,
        assignOutlet,
        removeOutlet,
        deactivateStaff,
        reactivateStaff,
        cancelInvite,
        refresh: load,
      }}
    >
      {children}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  const context = useContext(StaffContext);
  if (!context) throw new Error("useStaff must be used within a StaffProvider");
  return context;
}
