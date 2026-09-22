import React from "react";
import {
  GuestProvider,
  GuestsHeader,
  GuestsFilters,
  GuestList,
  GuestDetailDrawer,
  CreateGuestModal,
  EditGuestModal
} from "../features/guests";

export function GuestsPage() {
  return (
    <GuestProvider>
      <div className="space-y-4 pb-12 animate-in fade-in duration-200">
        <GuestsHeader />
        <GuestsFilters />
        <GuestList />
        <GuestDetailDrawer />
        <CreateGuestModal />
        <EditGuestModal />
      </div>
    </GuestProvider>
  );
}
