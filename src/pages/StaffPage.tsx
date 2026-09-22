import React, { useState } from "react";
import { StaffProvider, useStaff } from "../features/staff/context/StaffContext";
import { StaffHeader } from "../features/staff/components/StaffHeader";
import { StaffKpiBar } from "../features/staff/components/StaffKpiBar";
import { StaffList } from "../features/staff/components/StaffList";
import { StaffDetailDrawer } from "../features/staff/components/StaffDetailDrawer";
import { InviteStaffModal } from "../features/staff/components/InviteStaffModal";
import { useOrg } from "../context/OrgContext";
import { can } from "../features/staff/permissions";
import { AccessDenied } from "../components/AccessDenied";

function StaffPageContent() {
  const { selectedStaff, setSelectedStaff, isLoading, error } = useStaff();
  const { role } = useOrg();
  const [inviteOpen, setInviteOpen] = useState(false);

  if (!can(role, "staff.read")) {
    return <AccessDenied module="Staff Directory" />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-zinc-500 font-mono text-sm animate-pulse">Loading staff...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 font-mono text-sm">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StaffHeader onInvite={() => setInviteOpen(true)} />
      <StaffKpiBar />
      <StaffList />

      {selectedStaff && (
        <StaffDetailDrawer
          member={selectedStaff}
          onClose={() => setSelectedStaff(null)}
        />
      )}

      {inviteOpen && (
        <InviteStaffModal onClose={() => setInviteOpen(false)} />
      )}
    </div>
  );
}

export function StaffPage() {
  return (
    <StaffProvider>
      <StaffPageContent />
    </StaffProvider>
  );
}
