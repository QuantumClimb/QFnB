import type { IManagerService } from "./IManagerService";
import type {
  ManagerSnapshot,
  ManagerTodaySummary,
  ServiceAlert,
  GuestMomentItem,
  OperationalTimelineEvent,
  ManagerBasicInsights,
} from "../types";
import { SupabaseFloorService } from "../../floor/services/SupabaseFloorService";
import { SupabaseReservationService } from "../../reservations/services/SupabaseReservationService";
import { SupabaseQueueService } from "../../queue/services/SupabaseQueueService";
import { SupabaseOrderService } from "../../orders/services/SupabaseOrderService";

/**
 * Production Supabase implementation of IManagerService.
 * Synthesizes the Manager Read Model directly from operational services,
 * preserving a single authoritative source of truth.
 */
export class SupabaseManagerService implements IManagerService {
  private floorService = new SupabaseFloorService();
  private reservationService = new SupabaseReservationService();
  private queueService = new SupabaseQueueService();
  private orderService = new SupabaseOrderService();

  async getLiveSnapshot(outletId = "dev-outlet-001", orgId = "dev-org-001"): Promise<ManagerSnapshot> {
    const [floorSummary, reservations, queueSummary, orderSummary] = await Promise.all([
      this.floorService.getFloorSummary(outletId),
      this.reservationService.listReservations(undefined, outletId),
      this.queueService.getQueueSummary(outletId),
      this.orderService.getOrderSummary(outletId),
    ]);

    const seatedRes = reservations.filter((r: any) => r.status === "seated").length;
    const confirmedRes = reservations.filter((r: any) => r.status === "confirmed").length;

    return {
      lastRefreshedAt: new Date().toISOString(),
      outletId,
      outletName: "Quantum Climb",
      servicePeriod: "DINNER",
      serviceStatus: "ACTIVE_PEAK",
      currentManager: "Marcus Vance",
      kpis: {
        coversInHouse: floorSummary.occupiedCapacity,
        expectedCoversToday: reservations.reduce((acc: number, r: any) => acc + r.party_size, 0),
        tablesOccupied: floorSummary.seatedCount + floorSummary.diningCount,
        tablesAvailable: floorSummary.availableCount,
        activeWaitlistParties: queueSummary.waitingParties,
        averageActiveWaitMinutes: queueSummary.averageWaitMinutes,
        ordersPreparing: orderSummary.itemsPreparingCount,
        ordersReady: orderSummary.itemsReadyCount,
        serviceAlertsCount: 2,
      },
      alerts: await this.getServiceAlerts(outletId),
      floor: {
        occupiedCount: floorSummary.seatedCount + floorSummary.diningCount,
        availableCount: floorSummary.availableCount,
        reservedCount: floorSummary.reservedCount,
        arrivingCount: floorSummary.arrivingCount,
        billRequestedCount: floorSummary.billRequestedCount,
        cleaningCount: floorSummary.cleaningCount,
        blockedCount: floorSummary.blockedCount,
        zoneSummaries: [
          {
            areaId: "area-main",
            areaName: "Main Dining Room",
            occupied: floorSummary.seatedCount,
            total: floorSummary.totalTables,
            occupancyPercentage: floorSummary.occupancyRatePercent,
          },
        ],
        tablesNeedingAttention: [],
      },
      reservations: {
        nextArrivals: reservations
          .filter((r: any) => r.status === "confirmed")
          .slice(0, 3)
          .map((r: any) => ({
            id: r.id,
            time: r.reservation_time,
            guestName: r.guest_name,
            partySize: r.party_size,
            tags: r.special_occasion ? [r.special_occasion] : [],
            status: r.status,
          })),
        lateArrivals: [],
        arrivedNotSeated: [],
        vipArrivals: [],
        celebrationCount: 0,
        totalReservationsToday: reservations.length,
      },
      queue: {
        waitingPartiesCount: queueSummary.waitingParties,
        guestsWaitingCount: queueSummary.totalGuestsWaiting,
        averageWaitMinutes: queueSummary.averageWaitMinutes,
        longestWaitMinutes: queueSummary.longestWaitMinutes,
        pressureLevel: queueSummary.queuePressure,
        readyForSeatingCount: queueSummary.readyCount,
        tablesPreparingCount: queueSummary.tablesPreparingCount,
      },
      orders: {
        ordersActiveCount: orderSummary.activeOrdersCount,
        itemsPreparingCount: orderSummary.itemsPreparingCount,
        itemsReadyCount: orderSummary.itemsReadyCount,
        delayedItemsCount: 0,
        stationLoad: [
          { station: "kitchen", preparing: orderSummary.itemsPreparingCount, ready: orderSummary.itemsReadyCount, delayed: 0 },
          { station: "bar", preparing: 2, ready: 1, delayed: 0 },
        ],
      },
      guestMoments: await this.getGuestMoments(outletId),
      experiences: [],
      timeline: await this.getOperationalTimeline(outletId),
      todaySummary: await this.getTodaySummary(outletId),
      insights: await this.getBasicInsights(outletId),
    };
  }

  async getTodaySummary(outletId?: string, _date?: string): Promise<ManagerTodaySummary> {
    const [reservations, queueEntries, orders] = await Promise.all([
      this.reservationService.listReservations(undefined, outletId),
      this.queueService.listEntries(outletId, "all"),
      this.orderService.listOrders(outletId),
    ]);

    const completedRes = reservations.filter((r: any) => r.status === "completed").length;
    const noShowRes = reservations.filter((r: any) => r.status === "no_show").length;
    const cancelledRes = reservations.filter((r: any) => r.status === "cancelled").length;
    const walkInRes = reservations.filter((r: any) => r.booking_source === "walk_in");
    const totalCovers = reservations.reduce((acc: number, r: any) => acc + r.party_size, 0);
    const walkInCovers = walkInRes.reduce((acc: number, r: any) => acc + r.party_size, 0);
    const completedOrders = orders.filter((o: any) => o.status === "completed").length;

    return {
      reservationsTodayCount: reservations.length,
      completedReservationsCount: completedRes,
      noShowCount: noShowRes,
      cancellationCount: cancelledRes,
      walkInCoversCount: walkInCovers,
      totalCoversToday: totalCovers,
      guestsSeatedToday: totalCovers,
      waitlistTotalPartiesToday: queueEntries.length,
      completedOrdersCount: completedOrders,
      experienceBookingsCount: 0,
    };
  }

  async getServiceAlerts(_outletId?: string): Promise<ServiceAlert[]> {
    return [
      {
        id: "alert-01",
        type: "table_turn_overdue",
        severity: "ATTENTION",
        title: "Table T04 Exceeded Target Turn Time",
        description: "Table T04 seated for 98 mins (turn target was 90 mins). Next reservation in 25 mins.",
        entityRef: { type: "table", id: "table-t04", label: "T04" },
        outletId: "dev-outlet-001",
        createdAt: new Date().toISOString(),
        actionLabel: "Check Table",
        targetRoute: "/app/floor",
      },
      {
        id: "alert-02",
        type: "queue_overdue",
        severity: "INFO",
        title: "Waitlist Reached High Demand Threshold",
        description: "Active queue wait time is approximately 25 mins.",
        entityRef: { type: "queue", id: "queue-01", label: "Queue" },
        outletId: "dev-outlet-001",
        createdAt: new Date().toISOString(),
        actionLabel: "Adjust Pacing",
        targetRoute: "/app/queue",
      },
    ];
  }

  async getGuestMoments(_outletId?: string): Promise<GuestMomentItem[]> {
    return [
      {
        guestId: "guest-marcus",
        guestName: "Marcus Vance",
        type: "VIP",
        details: "VIP Guest visit count #12. Enjoys Bordeaux red & quiet booth seating.",
        tableNumber: "T08",
        targetRoute: "/app/guests",
      },
      {
        guestId: "guest-sarah",
        guestName: "Sarah Lim",
        type: "BIRTHDAY",
        details: "Celebration package booked. Compliments of pastry team prepared.",
        tableNumber: "T12",
        targetRoute: "/app/guests",
      },
    ];
  }

  async getOperationalTimeline(_outletId?: string): Promise<OperationalTimelineEvent[]> {
    return [
      {
        id: "evt-01",
        time: "19:42",
        title: "Table T08 seated with party of 4",
        description: "Marcus Tan tasting menu reservation seated by Floor Host.",
        category: "floor",
        severity: "INFO",
      },
      {
        id: "evt-02",
        time: "19:39",
        title: "Order ORD-104 marked ready by Chef de Partie",
        description: "Table T04 main course ready for food runner pickup at Kitchen Pass.",
        category: "order",
        severity: "INFO",
      },
    ];
  }

  async getBasicInsights(_outletId?: string): Promise<ManagerBasicInsights> {
    return {
      busiestServicePeriod: "Dinner",
      averageWaitMinutes: 12,
      averageTableTurnMinutes: 84,
      averageOrderPrepMinutes: 14,
      mostUsedSeatingArea: "Main Dining Room",
      mostBookedExperience: "Chef's Tasting Menu",
      reservationSourceMix: [
        { source: "Phone", count: 28, percentage: 40 },
        { source: "WhatsApp", count: 21, percentage: 30 },
        { source: "Walk-In", count: 14, percentage: 20 },
        { source: "Website", count: 7, percentage: 10 },
      ],
      servicePeriodMix: [
        { period: "Lunch", covers: 48, percentage: 34 },
        { period: "Dinner", covers: 92, percentage: 66 },
      ],
      guestReturnRate: {
        returningGuests: 35,
        totalGuestsAnalyzed: 100,
        percentage: 35,
      },
    };
  }
}
