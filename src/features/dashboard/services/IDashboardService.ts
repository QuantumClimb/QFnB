import type {
  DashboardData,
  UpcomingReservation,
  WaitlistItem,
  LiveOrderItem,
} from "../types";

export interface IDashboardService {
  getDashboardData(outletId?: string): Promise<DashboardData>;
  checkInReservation(reservationId: string): Promise<UpcomingReservation>;
  notifyWaitlistGuest(waitlistId: string): Promise<WaitlistItem>;
  seatWaitlistGuest(waitlistId: string, tableNumber: string): Promise<WaitlistItem>;
  markOrderReady(orderId: string): Promise<LiveOrderItem>;
  dismissAlert(alertId: string): Promise<void>;
  addQuickWalkIn(input: {
    guestName: string;
    partySize: number;
    preferredSection: string;
    tableNumber?: string;
    notes?: string;
  }): Promise<UpcomingReservation>;
  addWaitlistEntry(input: {
    guestName: string;
    guestPhone: string;
    partySize: number;
    preferredSection: "Main Dining" | "Bar High-Tops" | "Terrace" | "Any";
    quotedTimeMins: number;
    notes?: string;
  }): Promise<WaitlistItem>;
}
