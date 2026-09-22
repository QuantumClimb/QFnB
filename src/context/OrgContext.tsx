import React, { createContext, useContext, useEffect, useState } from "react";
import { Organization, Outlet, Role } from "../types";
import { DEV_FIXTURE_ORGANIZATIONS, DEV_FIXTURE_OUTLETS } from "../lib/fixtures";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

interface OrgContextType {
  organizations: Organization[];
  currentOrg: Organization | null;
  outlets: Outlet[];
  currentOutlet: Outlet | null;
  role: Role;
  isLoading: boolean;
  setCurrentOrg: (org: Organization) => void;
  setCurrentOutlet: (outlet: Outlet) => void;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, isDevPreview } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [currentOutlet, setCurrentOutlet] = useState<Outlet | null>(null);
  const [role, setRole] = useState<Role>("owner");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isDevPreview || !isSupabaseConfigured || !user) {
      // Use Development Fixture Data when in DEV PREVIEW or when Supabase is unconfigured
      setOrganizations(DEV_FIXTURE_ORGANIZATIONS);
      setCurrentOrg(DEV_FIXTURE_ORGANIZATIONS[0] || null);
      setOutlets(DEV_FIXTURE_OUTLETS);
      setCurrentOutlet(DEV_FIXTURE_OUTLETS[0] || null);
      setRole("owner");
      setIsLoading(false);
      return;
    }

    // Load Real Organizations and Outlets from Supabase RLS
    async function loadTenantData() {
      setIsLoading(true);
      try {
        const { data: memData } = await supabase
          .from("organization_members")
          .select("role, organization_id, organizations(*)")
          .eq("user_id", user!.id);

        if (memData && memData.length > 0) {
          const orgs = memData
            .map((m: any) => m.organizations)
            .filter(Boolean) as Organization[];
          setOrganizations(orgs);
          const firstOrg = orgs[0] || null;
          setCurrentOrg(firstOrg);
          setRole((memData[0]?.role as Role) || "staff");

          if (firstOrg) {
            const { data: outletData } = await supabase
              .from("outlets")
              .select("*")
              .eq("organization_id", firstOrg.id);

            const outs = (outletData as Outlet[]) || [];
            setOutlets(outs);
            setCurrentOutlet(outs[0] || null);
          }
        }
      } catch (err) {
        console.error("Error loading tenant data from Supabase:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadTenantData();
  }, [user, isDevPreview]);

  return (
    <OrgContext.Provider
      value={{
        organizations,
        currentOrg,
        outlets,
        currentOutlet,
        role,
        isLoading,
        setCurrentOrg,
        setCurrentOutlet,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error("useOrg must be used within an OrgProvider");
  }
  return context;
}
