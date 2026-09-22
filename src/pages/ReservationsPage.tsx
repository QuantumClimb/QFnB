import React from "react";
import { ReservationProvider, ReservationsView } from "../features/reservations";

export function ReservationsPage() {
  return (
    <ReservationProvider>
      <ReservationsView />
    </ReservationProvider>
  );
}

export default ReservationsPage;
