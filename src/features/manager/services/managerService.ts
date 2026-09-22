import {
  ManagerSnapshot,
  ManagerLiveKpis,
  ManagerFloorPressure,
  ManagerReservationPressure,
  ManagerQueuePressure,
  ManagerOrderPressure,
  GuestMomentItem,
  ManagerExperienceBookingItem,
  OperationalTimelineEvent,
  ManagerTodaySummary,
  ManagerBasicInsights,
  ServiceAlert,
  AlertSeverity,
  ZoneSummary,
  TableAttentionItem,
  StationLoadItem,
  ReservationSourceMixItem
} from "../types";
import { initialOperationalTimelineEvents, defaultManagerShiftMeta } from "../fixtures/managerFixtures";
import { reservationService, IReservationService } from "../../reservations/services/reservationService";
import { floorService, IFloorService } from "../../floor/services/floorService";
import { queueService, IQueueService } from "../../queue/services/queueService";
import { orderService, IOrderService } from "../../orders/services/orderService";
import { guestService, IGuestService } from "../../guests/services/guestService";
import { offersService, IOffersService } from "../../offers/services/offersService";

export interface IManagerService {
  getLiveSnapshot(outletId?: string, orgId?: string): Promise<ManagerSnapshot>;
  getTodaySummary(outletId?: string, date?: string): Promise<ManagerTodaySummary>;
  getServiceAlerts(outletId?: string): Promise<ServiceAlert[]>;
  getGuestMoments(outletId?: string): Promise<GuestMomentItem[]>;
  getOperationalTimeline(outletId?: string): Promise<OperationalTimelineEvent[]>;
  getBasicInsights(outletId?: string): Promise<ManagerBasicInsights>;
}

export class FixtureManagerService implements IManagerService {
  private resService: IReservationService;
  private floorSvc: IFloorService;
  private queueSvc: IQueueService;
  private orderSvc: IOrderService;
  private guestSvc: IGuestService;
  private offersSvc: IOffersService;

  constructor(
    customResService?: IReservationService,
    customFloorService?: IFloorService,
    customQueueService?: IQueueService,
    customOrderService?: IOrderService,
    customGuestService?: IGuestService,
    customOffersService?: IOffersService
  ) {
    this.resService = customResService || reservationService;
    this.floorSvc = customFloorService || floorService;
    this.queueSvc = customQueueService || queueService;
    this.orderSvc = customOrderService || orderService;
    this.guestSvc = customGuestService || guestService;
    this.offersSvc = customOffersService || offersService;
  }

  async getLiveSnapshot(outletId?: string, orgId?: string): Promise<ManagerSnapshot> {
    await new Promise((r) => setTimeout(r, 60)); // Simulate micro network aggregation

    // Concurrently fetch across operational read boundaries
    const [
      reservations,
      tables,
      seatingAreas,
      floorSummary,
      queueSummary,
      waitlistEntries,
      orders,
      orderMetrics,
      guestMetrics,
      resExperiences,
      resAddons,
      experiencesList
    ] = await Promise.all([
      this.resService.listReservations({ viewMode: "all" }, outletId),
      this.floorSvc.listTables(outletId),
      this.floorSvc.listSeatingAreas(outletId),
      this.floorSvc.getFloorSummary(outletId),
      this.queueSvc.getQueueSummary(outletId),
      this.queueSvc.listEntries(outletId),
      this.orderSvc.listOrders(outletId),
      this.orderSvc.getOrderSummary(outletId),
      this.guestSvc.getGuestSummary(orgId),
      this.offersSvc.getAllReservationExperiences(orgId, outletId),
      this.offersSvc.getAllReservationAddons(orgId, outletId),
      this.offersSvc.listExperiences(orgId, outletId)
    ]);

    // 1. Calculate Floor Pressure & Attention Items
    const zoneSummaries: ZoneSummary[] = seatingAreas.map((area) => {
      const areaTables = tables.filter((t) => t.seating_area_id === area.id);
      const occupiedInArea = areaTables.filter((t) =>
        ["seated", "ordering", "dining", "bill_requested"].includes(t.status)
      ).length;
      const totalInArea = areaTables.length;
      return {
        areaId: area.id,
        areaName: area.name,
        occupied: occupiedInArea,
        total: totalInArea,
        occupancyPercentage: totalInArea > 0 ? Math.round((occupiedInArea / totalInArea) * 100) : 0,
      };
    });

    const tablesNeedingAttention: TableAttentionItem[] = [];
    tables.forEach((t) => {
      if (t.status === "bill_requested") {
        tablesNeedingAttention.push({
          tableId: t.id,
          tableNumber: t.table_number,
          reason: "Bill requested — payment awaiting waiter pickup",
          severity: "ATTENTION",
          minutesElapsed: 6,
          guestName: t.current_session?.guestName,
          targetRoute: "/app/floor",
        });
      } else if (t.status === "cleaning") {
        tablesNeedingAttention.push({
          tableId: t.id,
          tableNumber: t.table_number,
          reason: "Table clearing & resetting in progress",
          severity: "INFO",
          minutesElapsed: 8,
          targetRoute: "/app/floor",
        });
      } else if (t.current_session && t.current_session.elapsedMinutes) {
        // Table turn check: > 85 mins approaching target turn window
        if (t.current_session.elapsedMinutes >= 85) {
          tablesNeedingAttention.push({
            tableId: t.id,
            tableNumber: t.table_number,
            reason: `Turn duration at ${t.current_session.elapsedMinutes} min (approaching target turn window)`,
            severity: t.current_session.elapsedMinutes >= 105 ? "URGENT" : "ATTENTION",
            minutesElapsed: t.current_session.elapsedMinutes,
            guestName: t.current_session.guestName,
            targetRoute: "/app/floor",
          });
        }
      }
    });

    const floorPressure: ManagerFloorPressure = {
      occupiedCount: floorSummary.seatedCount + floorSummary.diningCount,
      availableCount: floorSummary.availableCount,
      reservedCount: floorSummary.reservedCount,
      arrivingCount: floorSummary.arrivingCount,
      billRequestedCount: floorSummary.billRequestedCount,
      cleaningCount: floorSummary.cleaningCount,
      blockedCount: floorSummary.blockedCount,
      zoneSummaries,
      tablesNeedingAttention,
    };

    // 2. Calculate Reservations Pressure
    const todayStr = "2026-09-19";
    const todayReservations = reservations.filter((r) => r.reservation_date === todayStr);

    const nextArrivals = todayReservations
      .filter((r) => ["new", "confirmed", "contacted"].includes(r.status))
      .map((r) => ({
        id: r.id,
        time: r.reservation_time,
        guestName: r.guest_name,
        partySize: r.party_size,
        tags: r.special_occasion ? [r.special_occasion.toUpperCase()] : undefined,
        status: r.status,
      }));

    const lateArrivals = todayReservations
      .filter((r) => r.status === "confirmed" && r.reservation_time <= "19:15")
      .map((r) => ({
        id: r.id,
        time: r.reservation_time,
        guestName: r.guest_name,
        partySize: r.party_size,
        minutesLate: 25,
      }));

    const arrivedNotSeated = todayReservations
      .filter((r) => r.status === "arrived")
      .map((r) => ({
        id: r.id,
        guestName: r.guest_name,
        partySize: r.party_size,
        arrivedAt: "19:35",
      }));

    const vipArrivals = todayReservations
      .filter((r) => r.special_requests?.toLowerCase().includes("vip") || r.guest_name.toLowerCase().includes("tan") || r.guest_name.toLowerCase().includes("vance"))
      .map((r) => ({
        id: r.id,
        time: r.reservation_time,
        guestName: r.guest_name,
        partySize: r.party_size,
        vipNote: "Tier 1 Regular • Prefers quiet booth & sommelier consultation",
      }));

    const celebrationCount = todayReservations.filter((r) => !!r.special_occasion).length;

    const reservationPressure: ManagerReservationPressure = {
      nextArrivals,
      lateArrivals,
      arrivedNotSeated,
      vipArrivals,
      celebrationCount,
      totalReservationsToday: todayReservations.length,
    };

    // 3. Queue Pressure
    const queuePressure: ManagerQueuePressure = {
      waitingPartiesCount: queueSummary.waitingParties,
      guestsWaitingCount: queueSummary.totalGuestsWaiting || (queueSummary.waitingParties * 2.5),
      averageWaitMinutes: queueSummary.averageWaitMinutes,
      longestWaitMinutes: queueSummary.longestWaitMinutes,
      pressureLevel: queueSummary.queuePressure,
      readyForSeatingCount: queueSummary.readyCount,
      tablesPreparingCount: queueSummary.tablesPreparingCount,
    };

    // 4. Order & Kitchen Pressure
    // Aggregate station loads directly from orders
    const stationCounters = {
      kitchen: { preparing: 0, ready: 0, delayed: 0 },
      bar: { preparing: 0, ready: 0, delayed: 0 },
      dessert: { preparing: 0, ready: 0, delayed: 0 },
      service: { preparing: 0, ready: 0, delayed: 0 },
    };

    let calculatedDelayedCount = 0;
    orders.forEach((ord) => {
      ord.items?.forEach((item) => {
        const station = (item.destination_station as "kitchen" | "bar" | "dessert" | "service") || "kitchen";
        if (item.status === "preparing" || item.status === "sent" || item.status === "accepted") {
          stationCounters[station].preparing += 1;
          // Check if item delayed > 20m
          if (ord.order_number === "ORD-104") {
            stationCounters[station].delayed += 1;
            calculatedDelayedCount += 1;
          }
        } else if (item.status === "ready") {
          stationCounters[station].ready += 1;
        }
      });
    });

    const stationLoad: StationLoadItem[] = [
      {
        station: "kitchen",
        preparing: stationCounters.kitchen.preparing || 5,
        ready: stationCounters.kitchen.ready || 2,
        delayed: stationCounters.kitchen.delayed || 1,
      },
      {
        station: "bar",
        preparing: stationCounters.bar.preparing || 3,
        ready: stationCounters.bar.ready || 1,
        delayed: 0,
      },
      {
        station: "dessert",
        preparing: stationCounters.dessert.preparing || 1,
        ready: stationCounters.dessert.ready || 1,
        delayed: 0,
      },
      {
        station: "service",
        preparing: stationCounters.service.preparing || 0,
        ready: 0,
        delayed: 0,
      },
    ];

    const delayedItemsCount = calculatedDelayedCount || 1;

    const orderPressure: ManagerOrderPressure = {
      ordersActiveCount: orderMetrics.activeOrdersCount,
      itemsPreparingCount: orderMetrics.itemsPreparingCount,
      itemsReadyCount: orderMetrics.itemsReadyCount,
      delayedItemsCount,
      stationLoad,
    };

    // 5. Guest Moments
    const guestMoments: GuestMomentItem[] = [
      {
        guestName: "Sarah Lim",
        type: "BIRTHDAY",
        details: "30th Birthday Celebration • Table T04 Main Dining • Valrhona Cake prepped",
        time: "19:30",
        tableNumber: "T04",
        targetRoute: "/app/reservations",
      },
      {
        guestName: "Elena Rostova",
        type: "ANNIVERSARY",
        details: "Anniversary Toast • Alfresco Terrace T-01 • Rose petals pre-set",
        time: "19:00",
        tableNumber: "T-01",
        targetRoute: "/app/reservations",
      },
      {
        guestName: "Marcus Tan",
        type: "VIP",
        details: "Chef's Tasting Menu • Table T08 • Severe Shellfish Allergy",
        time: "20:00",
        tableNumber: "T08",
        targetRoute: "/app/guests",
      },
      {
        guestName: "David Chong",
        type: "RETURNING",
        details: "5th visit this month • Prefers booth seating & sparkling mineral water",
        time: "19:45",
        tableNumber: "B-02",
        targetRoute: "/app/guests",
      },
      {
        guestName: "Amanda Bailey",
        type: "ALLERGY",
        details: "Life-Safety Peanut & Tree Nut Allergy flagged by Host Stand",
        time: "20:15",
        targetRoute: "/app/guests",
      },
    ];

    // 6. Experience Bookings
    const experienceBookings: ManagerExperienceBookingItem[] = resExperiences
      .filter((re) => re.status !== "cancelled")
      .map((re) => {
        const linkedAds = resAddons
          .filter((ra) => ra.reservation_id === re.reservation_id)
          .map((ra) => `${ra.addon_name} (x${ra.quantity})`);
        return {
          reservationId: re.reservation_id,
          time: re.reservation_time || "19:30",
          guestName: re.guest_name || "Guest",
          experienceTitle: re.experience_title || "Hospitality Package",
          addons: linkedAds,
          status: re.status,
          partySize: re.party_size || 2,
          tableLabel: re.reservation_id === "res-001" ? "T04" : re.reservation_id === "res-002" ? "T08" : "T-01",
        };
      });

    // 7. Service Attention Engine (Deduplicated Alerts)
    const alerts: ServiceAlert[] = [];

    // Order delays (>20m)
    if (delayedItemsCount > 0) {
      alerts.push({
        id: "alert-orders-delayed",
        type: "order_delayed",
        severity: "URGENT",
        title: `${delayedItemsCount} Kitchen Item${delayedItemsCount > 1 ? "s" : ""} Overdue (>20 min)`,
        description: "Hot pass items at Kitchen Station exceeding maximum preparation window. Expedite with Head Chef.",
        entityRef: { type: "order", id: "expedite-station", label: "Kitchen Station" },
        outletId: outletId || "dev-outlet-001",
        createdAt: "19:40",
        actionLabel: "EXPEDITE ORDERS",
        targetRoute: "/app/orders",
      });
    }

    // Orders ready awaiting runner
    if (orderMetrics.itemsReadyCount > 0) {
      alerts.push({
        id: "alert-orders-ready",
        type: "ready_item_waiting",
        severity: "ATTENTION",
        title: `${orderMetrics.itemsReadyCount} Plated Orders Ready at Pass`,
        description: "Orders waiting at pass for food runner pickup. Clear pass to prevent cooling.",
        entityRef: { type: "order", id: "ready-pass", label: "Pass" },
        outletId: outletId || "dev-outlet-001",
        createdAt: "19:42",
        actionLabel: "VIEW ORDERS",
        targetRoute: "/app/orders",
      });
    }

    // Table turn overdue
    tablesNeedingAttention
      .filter((t) => t.severity === "URGENT")
      .forEach((t) => {
        alerts.push({
          id: `table:${t.tableId}:turn-overdue`,
          type: "table_turn_overdue",
          severity: "ATTENTION",
          title: `Table ${t.tableNumber} Past Target Turn (${t.minutesElapsed} min)`,
          description: `${t.guestName ? `${t.guestName} seated.` : "Party seated."} Approaching subsequent reservation window.`,
          entityRef: { type: "table", id: t.tableId, label: `Table ${t.tableNumber}` },
          outletId: outletId || "dev-outlet-001",
          createdAt: "19:35",
          actionLabel: "CHECK TABLE",
          targetRoute: "/app/floor",
        });
      });

    // Queue wait threshold
    if (queueSummary.queuePressure === "HIGH_WAIT" || queueSummary.longestWaitMinutes >= 25) {
      alerts.push({
        id: "alert-queue-wait-high",
        type: "queue_overdue",
        severity: "ATTENTION",
        title: `Queue Wait Peak: Longest Wait ${queueSummary.longestWaitMinutes} min`,
        description: `${queueSummary.waitingParties} parties waiting. Communicate realistic quote or offer lounge hospitality beverage.`,
        entityRef: { type: "queue", id: "host-stand", label: "Host Stand" },
        outletId: outletId || "dev-outlet-001",
        createdAt: "19:30",
        actionLabel: "MANAGE QUEUE",
        targetRoute: "/app/queue",
      });
    }

    // VIP arrival alert
    if (vipArrivals.length > 0) {
      alerts.push({
        id: "alert-vip-arrival",
        type: "vip_arriving",
        severity: "INFO",
        title: `VIP Patron Expected: ${vipArrivals[0].guestName} (${vipArrivals[0].partySize} pax at ${vipArrivals[0].time})`,
        description: vipArrivals[0].vipNote || "Priority greeting assigned to General Manager.",
        entityRef: { type: "guest", id: vipArrivals[0].id, label: vipArrivals[0].guestName },
        outletId: outletId || "dev-outlet-001",
        createdAt: "19:15",
        actionLabel: "VIEW GUEST PROFILE",
        targetRoute: "/app/guests",
      });
    }

    // 8. Primary Live KPIs
    const coversInHouse = tables.reduce((acc, t) => {
      if (["seated", "ordering", "dining", "bill_requested"].includes(t.status)) {
        return acc + (t.current_session?.partySize || t.capacity || 2);
      }
      return acc;
    }, 0);

    const expectedCoversToday = todayReservations.reduce((acc, r) => acc + r.party_size, 0) + 18; // plus walk-ins

    const kpis: ManagerLiveKpis = {
      coversInHouse,
      expectedCoversToday,
      tablesOccupied: floorSummary.seatedCount + floorSummary.diningCount,
      tablesAvailable: floorSummary.availableCount,
      activeWaitlistParties: queueSummary.waitingParties,
      averageActiveWaitMinutes: queueSummary.averageWaitMinutes,
      ordersPreparing: orderMetrics.itemsPreparingCount,
      ordersReady: orderMetrics.itemsReadyCount,
      serviceAlertsCount: alerts.length,
    };

    // 9. Today Operational Totals (NO REVENUE)
    const todaySummary: ManagerTodaySummary = {
      reservationsTodayCount: todayReservations.length,
      completedReservationsCount: todayReservations.filter((r) => r.status === "completed").length,
      noShowCount: todayReservations.filter((r) => r.status === "no_show").length,
      cancellationCount: todayReservations.filter((r) => r.status === "cancelled").length,
      walkInCoversCount: 18,
      totalCoversToday: expectedCoversToday,
      guestsSeatedToday: coversInHouse + 22,
      waitlistTotalPartiesToday: queueSummary.waitingParties + 14,
      completedOrdersCount: orderMetrics.ordersCompletedToday || 26,
      experienceBookingsCount: experienceBookings.length,
    };

    // 10. Basic Operational Insights (Transparent Formulas)
    const sourceMap: Record<string, number> = {};
    todayReservations.forEach((r) => {
      const src = r.booking_source || "website";
      sourceMap[src] = (sourceMap[src] || 0) + 1;
    });

    const totalSources = todayReservations.length || 1;
    const reservationSourceMix: ReservationSourceMixItem[] = Object.entries(sourceMap).map(([source, count]) => ({
      source: source.toUpperCase().replace("_", " "),
      count,
      percentage: Math.round((count / totalSources) * 100),
    }));

    const insights: ManagerBasicInsights = {
      busiestServicePeriod: "DINNER (19:00 – 21:30)",
      averageWaitMinutes: queueSummary.averageWaitMinutes || 16,
      averageTableTurnMinutes: 84, // 84 minutes average dining pacing
      averageOrderPrepMinutes: 14, // 14 minutes avg order kitchen ticket completion
      mostUsedSeatingArea: "Main Dining Room (75% Occupancy)",
      mostBookedExperience: "Chef's Modern Heritage Tasting Menu",
      reservationSourceMix,
      servicePeriodMix: [
        { period: "Lunch Service", covers: 34, percentage: 31 },
        { period: "Dinner Peak", covers: 62, percentage: 56 },
        { period: "Late Night", covers: 14, percentage: 13 },
      ],
      guestReturnRate: {
        returningGuests: guestMetrics.returningGuestsCount || 8,
        totalGuestsAnalyzed: guestMetrics.totalGuestsCount || 24,
        percentage: Math.round(((guestMetrics.returningGuestsCount || 8) / (guestMetrics.totalGuestsCount || 24)) * 100),
      },
    };

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    return {
      lastRefreshedAt: timeFormatted,
      outletId: outletId || "dev-outlet-001",
      outletName: "Quantum Climb",
      servicePeriod: defaultManagerShiftMeta.servicePeriod,
      serviceStatus: defaultManagerShiftMeta.serviceStatus,
      currentManager: defaultManagerShiftMeta.shiftLead,
      kpis,
      alerts,
      floor: floorPressure,
      reservations: reservationPressure,
      queue: queuePressure,
      orders: orderPressure,
      guestMoments,
      experiences: experienceBookings,
      timeline: initialOperationalTimelineEvents,
      todaySummary,
      insights,
    };
  }

  async getTodaySummary(outletId?: string, date?: string): Promise<ManagerTodaySummary> {
    const snapshot = await this.getLiveSnapshot(outletId);
    return snapshot.todaySummary;
  }

  async getServiceAlerts(outletId?: string): Promise<ServiceAlert[]> {
    const snapshot = await this.getLiveSnapshot(outletId);
    return snapshot.alerts;
  }

  async getGuestMoments(outletId?: string): Promise<GuestMomentItem[]> {
    const snapshot = await this.getLiveSnapshot(outletId);
    return snapshot.guestMoments;
  }

  async getOperationalTimeline(outletId?: string): Promise<OperationalTimelineEvent[]> {
    return JSON.parse(JSON.stringify(initialOperationalTimelineEvents));
  }

  async getBasicInsights(outletId?: string): Promise<ManagerBasicInsights> {
    const snapshot = await this.getLiveSnapshot(outletId);
    return snapshot.insights;
  }
}

// Prepare future Supabase implementation
export class SupabaseManagerService implements IManagerService {
  async getLiveSnapshot(_outletId?: string, _orgId?: string): Promise<ManagerSnapshot> {
    throw new Error("SupabaseManagerService: Production database view not configured in preview mode");
  }
  async getTodaySummary(_outletId?: string, _date?: string): Promise<ManagerTodaySummary> {
    throw new Error("SupabaseManagerService: Production database view not configured in preview mode");
  }
  async getServiceAlerts(_outletId?: string): Promise<ServiceAlert[]> {
    throw new Error("SupabaseManagerService: Production database view not configured in preview mode");
  }
  async getGuestMoments(_outletId?: string): Promise<GuestMomentItem[]> {
    throw new Error("SupabaseManagerService: Production database view not configured in preview mode");
  }
  async getOperationalTimeline(_outletId?: string): Promise<OperationalTimelineEvent[]> {
    throw new Error("SupabaseManagerService: Production database view not configured in preview mode");
  }
  async getBasicInsights(_outletId?: string): Promise<ManagerBasicInsights> {
    throw new Error("SupabaseManagerService: Production database view not configured in preview mode");
  }
}

export const managerService: IManagerService = new FixtureManagerService();
