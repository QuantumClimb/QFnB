import React from "react";
import { ReservationsHeader } from "./ReservationsHeader";
import { ReservationFilterBar } from "./ReservationFilterBar";
import { ReservationListView } from "./ReservationListView";
import { ReservationDetailDrawer } from "./ReservationDetailDrawer";
import { CreateReservationModal } from "./CreateReservationModal";
import { useReservations } from "../context/ReservationContext";

export function ReservationsView() {
  const { 
    selectedReservation, 
    setSelectedReservation, 
    isCreateModalOpen, 
    setIsCreateModalOpen 
  } = useReservations();

  return (
    <div className="space-y-6 sm:space-y-8 font-sans">
      
      {/* 1. Header with view mode tabs & action trigger */}
      <ReservationsHeader />

      {/* 2. Search & Filter Bar */}
      <ReservationFilterBar />

      {/* 3. Operational List / Table */}
      <ReservationListView />

      {/* 4. Slide-over Detail Drawer */}
      <ReservationDetailDrawer
        reservation={selectedReservation}
        onClose={() => setSelectedReservation(null)}
      />

      {/* 5. Fast Staff Reservation Creation Modal */}
      <CreateReservationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

    </div>
  );
}
