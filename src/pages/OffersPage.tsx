import React from "react";
import {
  OffersProvider,
  useOffers,
  OffersHeader,
  OffersKpiHeader,
  OffersFilterBar,
  ExperiencesListView,
  ExperienceDetailDrawer,
  CreateExperienceModal,
  EditExperienceModal,
  OffersListView,
  CreateOfferModal,
  AddonsListView,
  CreateAddonModal,
  ReservationBookingsView,
  AttachExperienceModal,
  AttachAddonModal,
} from "../features/offers";

function OffersWorkspace() {
  const { activeTab, error } = useOffers();

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header & View Switcher */}
      <OffersHeader />

      {/* Operational KPI Metrics Header */}
      <OffersKpiHeader />

      {/* Error Banner if any */}
      {error && (
        <div className="p-4 bg-rose-950/80 border border-rose-500/40 text-rose-300 font-mono text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Tab Specific Content */}
      {activeTab === "EXPERIENCES" && (
        <div className="space-y-4">
          <OffersFilterBar />
          <ExperiencesListView />
        </div>
      )}

      {activeTab === "OFFERS" && (
        <div className="space-y-4">
          <OffersFilterBar />
          <OffersListView />
        </div>
      )}

      {activeTab === "ADD_ONS" && (
        <div className="space-y-4">
          <AddonsListView />
        </div>
      )}

      {activeTab === "RESERVATION_BOOKINGS" && (
        <div className="space-y-4">
          <ReservationBookingsView />
        </div>
      )}

      {/* Slide-over Drawers & Interactive Workflow Modals */}
      <ExperienceDetailDrawer />
      <CreateExperienceModal />
      <EditExperienceModal />
      <CreateOfferModal />
      <CreateAddonModal />
      <AttachExperienceModal />
      <AttachAddonModal />
    </div>
  );
}

export function OffersPage() {
  return (
    <OffersProvider>
      <OffersWorkspace />
    </OffersProvider>
  );
}
