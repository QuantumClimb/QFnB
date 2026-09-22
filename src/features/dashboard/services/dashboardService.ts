import { 
  DashboardData, 
  UpcomingReservation, 
  WaitlistItem, 
  LiveOrderItem, 
  ServiceAlert 
} from "../types";
import { initialDashboardFixture } from "../fixtures/todayFixtures";

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

class FixtureDashboardService implements IDashboardService {
  private currentData: DashboardData;

  constructor() {
    // Deep copy initial fixture to support dynamic in-memory mutations in dev preview
    this.currentData = JSON.parse(JSON.stringify(initialDashboardFixture));
  }

  async getDashboardData(_outletId?: string): Promise<DashboardData> {
    // Simulate slight async network boundary
    await new Promise((res) => setTimeout(res, 80));
    return {
      ...this.currentData,
      lastUpdated: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
  }

  async checkInReservation(reservationId: string): Promise<UpcomingReservation> {
    await new Promise((res) => setTimeout(res, 100));
    const target = this.currentData.upcomingReservations.find((r) => r.id === reservationId);
    if (!target) {
      throw new Error(`Reservation ${reservationId} not found`);
    }
    
    // Update status to seated
    if (target.status !== "seated") {
      target.status = "seated";
      this.currentData.kpis.reservationsSeated += 1;
      this.currentData.kpis.guestsSeatedCount += target.partySize;
      this.currentData.kpis.coversSeated += target.partySize;
      this.currentData.kpis.coversRemaining = Math.max(0, this.currentData.kpis.coversRemaining - target.partySize);
      if (this.currentData.kpis.tablesAvailableCount > 0) {
        this.currentData.kpis.tablesAvailableCount -= 1;
      }
    }
    return target;
  }

  async notifyWaitlistGuest(waitlistId: string): Promise<WaitlistItem> {
    await new Promise((res) => setTimeout(res, 80));
    const target = this.currentData.activeWaitlist.find((w) => w.id === waitlistId);
    if (!target) {
      throw new Error(`Waitlist entry ${waitlistId} not found`);
    }
    target.status = "notified";
    target.notifiedAt = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return target;
  }

  async seatWaitlistGuest(waitlistId: string, tableNumber: string): Promise<WaitlistItem> {
    await new Promise((res) => setTimeout(res, 100));
    const targetIndex = this.currentData.activeWaitlist.findIndex((w) => w.id === waitlistId);
    if (targetIndex === -1) {
      throw new Error(`Waitlist entry ${waitlistId} not found`);
    }
    const item = this.currentData.activeWaitlist[targetIndex];
    item.status = "seated";

    // Remove from active waitlist
    this.currentData.activeWaitlist.splice(targetIndex, 1);
    this.currentData.kpis.activeWaitlistParties = Math.max(0, this.currentData.kpis.activeWaitlistParties - 1);
    this.currentData.kpis.activeWaitlistCovers = Math.max(0, this.currentData.kpis.activeWaitlistCovers - item.partySize);
    this.currentData.kpis.guestsSeatedCount += item.partySize;

    // Add to upcoming reservations as seated walk-in
    this.currentData.upcomingReservations.unshift({
      id: `walkin-${Date.now()}`,
      guestName: item.guestName,
      guestPhone: item.guestPhone,
      guestTier: "regular",
      partySize: item.partySize,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      tableNumber: tableNumber || "T-02",
      section: item.preferredSection === "Any" ? "Main Dining Room" : item.preferredSection,
      status: "seated",
      tags: ["Walk-in from Waitlist"],
      notes: item.notes,
    });

    return item;
  }

  async markOrderReady(orderId: string): Promise<LiveOrderItem> {
    await new Promise((res) => setTimeout(res, 80));
    const target = this.currentData.liveOrders.find((o) => o.id === orderId);
    if (!target) {
      throw new Error(`Order ${orderId} not found`);
    }
    if (target.status !== "ready") {
      target.status = "ready";
      this.currentData.kpis.pendingOrdersCount = Math.max(0, this.currentData.kpis.pendingOrdersCount - 1);
      this.currentData.kpis.ordersReadyCount += 1;
      if (target.isUrgent) {
        target.isUrgent = false;
        this.currentData.kpis.pendingOrdersDelayedCount = Math.max(0, this.currentData.kpis.pendingOrdersDelayedCount - 1);
      }
    }
    return target;
  }

  async dismissAlert(alertId: string): Promise<void> {
    await new Promise((res) => setTimeout(res, 50));
    this.currentData.serviceAlerts = this.currentData.serviceAlerts.filter((a) => a.id !== alertId);
    this.currentData.kpis.serviceAlertsCount = this.currentData.serviceAlerts.length;
  }

  async addQuickWalkIn(input: {
    guestName: string;
    partySize: number;
    preferredSection: string;
    tableNumber?: string;
    notes?: string;
  }): Promise<UpcomingReservation> {
    await new Promise((res) => setTimeout(res, 100));
    const newReservation: UpcomingReservation = {
      id: `walkin-${Date.now()}`,
      guestName: input.guestName,
      guestPhone: "Walk-in Guest",
      guestTier: "regular",
      partySize: input.partySize,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      tableNumber: input.tableNumber || "T-05",
      section: input.preferredSection || "Main Dining Room",
      status: "seated",
      tags: ["Immediate Walk-in"],
      notes: input.notes,
    };

    this.currentData.upcomingReservations.unshift(newReservation);
    this.currentData.kpis.guestsSeatedCount += input.partySize;
    this.currentData.kpis.coversSeated += input.partySize;
    this.currentData.kpis.expectedCovers += input.partySize;
    if (this.currentData.kpis.tablesAvailableCount > 0) {
      this.currentData.kpis.tablesAvailableCount -= 1;
    }

    return newReservation;
  }

  async addWaitlistEntry(input: {
    guestName: string;
    guestPhone: string;
    partySize: number;
    preferredSection: "Main Dining" | "Bar High-Tops" | "Terrace" | "Any";
    quotedTimeMins: number;
    notes?: string;
  }): Promise<WaitlistItem> {
    await new Promise((res) => setTimeout(res, 100));
    const newEntry: WaitlistItem = {
      id: `wl-${Date.now()}`,
      guestName: input.guestName,
      guestPhone: input.guestPhone,
      partySize: input.partySize,
      quotedTimeMins: input.quotedTimeMins,
      elapsedMins: 0,
      preferredSection: input.preferredSection,
      status: "waiting",
      notes: input.notes,
    };

    this.currentData.activeWaitlist.push(newEntry);
    this.currentData.kpis.activeWaitlistParties += 1;
    this.currentData.kpis.activeWaitlistCovers += input.partySize;

    return newEntry;
  }
}

// Export singleton instance adhering to the boundary interface
export const dashboardService: IDashboardService = new FixtureDashboardService();
