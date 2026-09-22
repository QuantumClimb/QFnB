import type { IDashboardService } from "./IDashboardService";
import type {
  DashboardData,
  UpcomingReservation,
  WaitlistItem,
  LiveOrderItem,
  ReservationStatus,
} from "../types";
import { SupabaseReservationService } from "../../reservations/services/SupabaseReservationService";
import { SupabaseFloorService } from "../../floor/services/SupabaseFloorService";
import { SupabaseQueueService } from "../../queue/services/SupabaseQueueService";
import { SupabaseOrderService } from "../../orders/services/SupabaseOrderService";

export class SupabaseDashboardService implements IDashboardService {
  private reservationService = new SupabaseReservationService();
  private floorService = new SupabaseFloorService();
  private queueService = new SupabaseQueueService();
  private orderService = new SupabaseOrderService();

  async getDashboardData(outletId = "dev-outlet-001"): Promise<DashboardData> {
    const [floorSummary, reservations, queueEntries, orders] = await Promise.all([
      this.floorService.getFloorSummary(outletId),
      this.reservationService.listReservations(undefined, outletId),
      this.queueService.listEntries(outletId),
      this.orderService.listOrders(outletId),
    ]);

    const upcomingReservations: UpcomingReservation[] = reservations
      .slice(0, 8)
      .map((r) => ({
        id: r.id,
        guestName: r.guest_name,
        guestPhone: r.phone || "",
        guestTier: "regular" as const,
        partySize: r.party_size,
        time: r.reservation_time,
        tableNumber: r.assigned_table_label || null,
        section: r.seating_area_name || "Main Dining Room",
        status: this.mapReservationStatus(r.status),
        tags: this.buildReservationTags(r),
        notes: r.special_requests || undefined,
      }));

    const activeWaitlist: WaitlistItem[] = queueEntries.map((q) => ({
      id: q.id,
      guestName: q.guest_name,
      guestPhone: q.phone,
      partySize: q.party_size,
      quotedTimeMins: q.quoted_wait_minutes,
      elapsedMins: Math.max(0, Math.floor((Date.now() - new Date(q.joined_at).getTime()) / 60000)),
      status: q.status === "notified" ? "notified" as const : "waiting" as const,
      preferredSection: "Main Dining" as const,
    }));

    const liveOrders: LiveOrderItem[] = orders
      .filter((o) => o.status === "in_progress" || o.status === "open" || o.status === "sent")
      .map((o) => ({
        id: o.id,
        orderNumber: o.order_number || `#${o.id.slice(0, 3)}`,
        tableNumber: o.table_number || "T1",
        serverName: o.assigned_staff_name || "Staff",
        destination: "Kitchen" as const,
        summary: o.items.map((i) => `${i.quantity}x ${i.item_name}`).join(", ") || "Order in prep",
        itemCount: o.items.reduce((acc, i) => acc + i.quantity, 0),
        status: "preparing" as const,
        elapsedMinutes: Math.max(0, Math.floor((Date.now() - new Date(o.opened_at).getTime()) / 60000)),
        isUrgent: false,
      }));

    const totalOccupied = floorSummary.seatedCount + floorSummary.diningCount;

    return {
      servicePeriod: {
        name: "Dinner Service",
        status: "active",
        statusLabel: "ACTIVE",
        shiftTime: "17:30 - 23:00",
        shiftManager: "Marcus Vance (GM)",
        servicePacingStatus: "optimal",
      },
      kpis: {
        reservationsCount: reservations.length,
        reservationsConfirmed: reservations.filter((r) => r.status === "confirmed").length,
        reservationsSeated: reservations.filter((r) => r.status === "seated").length,
        reservationsCancelled: reservations.filter((r) => r.status === "cancelled").length,
        expectedCovers: reservations.reduce((acc, r) => acc + r.party_size, 0),
        coversSeated: floorSummary.occupiedCapacity,
        coversRemaining: Math.max(0, reservations.reduce((acc, r) => acc + r.party_size, 0) - floorSummary.occupiedCapacity),
        guestsSeatedCount: floorSummary.occupiedCapacity,
        seatingCapacityMax: floorSummary.totalCapacity,
        tablesAvailableCount: floorSummary.availableCount,
        tablesTotalCount: floorSummary.totalTables,
        activeWaitlistParties: queueEntries.filter((q) => q.status === "waiting" || q.status === "notified").length,
        activeWaitlistCovers: queueEntries.filter((q) => q.status === "waiting" || q.status === "notified").reduce((acc, q) => acc + q.party_size, 0),
        avgWaitTimeMinutes: 15,
        pendingOrdersCount: liveOrders.length,
        pendingOrdersDelayedCount: 0,
        ordersReadyCount: orders.filter((o) => o.status === "ready" || o.status === "partially_served").length,
        serviceAlertsCount: 0,
      },
      upcomingReservations,
      activeWaitlist,
      liveOrders,
      floorSections: [
        {
          id: "sec-main",
          name: "Main Dining Room",
          tablesTotal: floorSummary.totalTables,
          tablesOccupied: totalOccupied,
          tablesReserved: floorSummary.reservedCount,
          tablesAvailable: floorSummary.availableCount,
          capacityCovers: floorSummary.totalCapacity,
          seatedCovers: floorSummary.occupiedCapacity,
          turnaroundAvgMins: 85,
        },
      ],
      serviceAlerts: [],
      guestMoments: [],
      smartAvailability: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  async checkInReservation(reservationId: string): Promise<UpcomingReservation> {
    const updated = await this.reservationService.changeStatus(reservationId, "arrived");
    return {
      id: updated.id,
      guestName: updated.guest_name,
      guestPhone: updated.phone || "",
      guestTier: "regular" as const,
      partySize: updated.party_size,
      time: updated.reservation_time,
      tableNumber: updated.assigned_table_label || null,
      section: updated.seating_area_name || "Main Dining Room",
      status: "arriving_soon",
      tags: this.buildReservationTags(updated),
    };
  }

  async notifyWaitlistGuest(waitlistId: string): Promise<WaitlistItem> {
    const updated = await this.queueService.changeStatus(waitlistId, "notified");
    return {
      id: updated.id,
      guestName: updated.guest_name,
      guestPhone: updated.phone,
      partySize: updated.party_size,
      quotedTimeMins: updated.quoted_wait_minutes,
      elapsedMins: Math.max(0, Math.floor((Date.now() - new Date(updated.joined_at).getTime()) / 60000)),
      status: "notified",
      preferredSection: "Main Dining",
    };
  }

  async seatWaitlistGuest(waitlistId: string, tableNumber: string): Promise<WaitlistItem> {
    const updated = await this.queueService.changeStatus(waitlistId, "seated");
    return {
      id: updated.id,
      guestName: updated.guest_name,
      guestPhone: updated.phone,
      partySize: updated.party_size,
      quotedTimeMins: updated.quoted_wait_minutes,
      elapsedMins: Math.max(0, Math.floor((Date.now() - new Date(updated.joined_at).getTime()) / 60000)),
      status: "seated",
      preferredSection: "Main Dining",
    };
  }

  async markOrderReady(orderId: string): Promise<LiveOrderItem> {
    return {
      id: orderId,
      orderNumber: "#—",
      tableNumber: "T1",
      serverName: "Staff",
      destination: "Kitchen",
      summary: "Items ready for pass",
      itemCount: 2,
      status: "ready",
      elapsedMinutes: 12,
    };
  }

  async dismissAlert(_alertId: string): Promise<void> {
    // Alert dismissed in UI state
  }

  async addQuickWalkIn(input: {
    guestName: string;
    partySize: number;
    preferredSection: string;
    tableNumber?: string;
    notes?: string;
  }): Promise<UpcomingReservation> {
    const res = await this.reservationService.createReservation({
      guest_name: input.guestName,
      phone: "+60 11 6424 2145",
      party_size: input.partySize,
      reservation_date: new Date().toISOString().split("T")[0],
      reservation_time: new Date().toTimeString().slice(0, 5),
      special_requests: input.notes,
      booking_source: "walk_in",
    });

    return {
      id: res.id,
      guestName: res.guest_name,
      guestPhone: res.phone || "",
      guestTier: "regular",
      partySize: res.party_size,
      time: res.reservation_time,
      tableNumber: input.tableNumber || null,
      section: input.preferredSection,
      status: "seated",
      tags: [],
    };
  }

  async addWaitlistEntry(input: {
    guestName: string;
    guestPhone: string;
    partySize: number;
    preferredSection: "Main Dining" | "Bar High-Tops" | "Terrace" | "Any";
    quotedTimeMins: number;
    notes?: string;
  }): Promise<WaitlistItem> {
    const entry = await this.queueService.addEntry({
      guest_name: input.guestName,
      phone: input.guestPhone,
      party_size: input.partySize,
      quoted_wait_minutes: input.quotedTimeMins,
      notes: input.notes,
    });

    return {
      id: entry.id,
      guestName: entry.guest_name,
      guestPhone: entry.phone,
      partySize: entry.party_size,
      quotedTimeMins: entry.quoted_wait_minutes,
      elapsedMins: 0,
      status: "waiting",
      preferredSection: input.preferredSection,
    };
  }

  private mapReservationStatus(status: string): ReservationStatus {
    const statusMap: Record<string, ReservationStatus> = {
      "new": "confirmed",
      "contacted": "confirmed",
      "confirmed": "confirmed",
      "arrived": "arriving_soon",
      "seated": "seated",
      "completed": "completed",
      "cancelled": "cancelled",
      "no_show": "cancelled",
    };
    return statusMap[status] || "confirmed";
  }

  private buildReservationTags(r: any): string[] {
    const tags: string[] = [];
    if (r.special_occasion) tags.push(r.special_occasion);
    if (r.allergies) tags.push(`Allergy: ${r.allergies}`);
    if (r.dietary_requirements) tags.push(r.dietary_requirements);
    return tags;
  }
}
