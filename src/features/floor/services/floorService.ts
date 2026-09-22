import { 
  RestaurantTable, 
  TableStatus, 
  FloorSeatingArea, 
  FloorSummary,
  CurrentGuestSession,
  TableStateHistoryItem,
  SeatReservationInput,
  SeatWalkInInput,
  MovePartyInput
} from "../types";
import { initialFloorAreasFixture, initialTablesFixture } from "../fixtures/floorFixtures";

export interface IFloorService {
  listSeatingAreas(outletId?: string): Promise<FloorSeatingArea[]>;
  listTables(outletId?: string, areaId?: string): Promise<RestaurantTable[]>;
  getTable(tableId: string): Promise<RestaurantTable | null>;
  changeTableStatus(tableId: string, status: TableStatus, note?: string, changedBy?: string): Promise<RestaurantTable>;
  seatReservation(tableId: string, reservationId: string, guestData: SeatReservationInput): Promise<RestaurantTable>;
  seatWalkIn(tableId: string, guestData: SeatWalkInInput): Promise<RestaurantTable>;
  moveParty(fromTableId: string, toTableId: string): Promise<{ fromTable: RestaurantTable; toTable: RestaurantTable }>;
  markCleaning(tableId: string): Promise<RestaurantTable>;
  markAvailable(tableId: string): Promise<RestaurantTable>;
  blockTable(tableId: string, reason?: string): Promise<RestaurantTable>;
  getFloorSummary(outletId?: string): Promise<FloorSummary>;
}

class FixtureFloorService implements IFloorService {
  private tables: RestaurantTable[];
  private areas: FloorSeatingArea[];
  private history: TableStateHistoryItem[] = [];

  constructor() {
    this.tables = JSON.parse(JSON.stringify(initialTablesFixture));
    this.areas = JSON.parse(JSON.stringify(initialFloorAreasFixture));
  }

  async listSeatingAreas(_outletId?: string): Promise<FloorSeatingArea[]> {
    await new Promise((res) => setTimeout(res, 40));
    return this.areas.map((area) => ({
      ...area,
      tablesCount: this.tables.filter((t) => t.seating_area_id === area.id).length,
    }));
  }

  async listTables(_outletId?: string, areaId?: string): Promise<RestaurantTable[]> {
    await new Promise((res) => setTimeout(res, 50));
    let result = [...this.tables];
    if (areaId && areaId !== "all") {
      result = result.filter((t) => t.seating_area_id === areaId);
    }
    return result;
  }

  async getTable(tableId: string): Promise<RestaurantTable | null> {
    await new Promise((res) => setTimeout(res, 30));
    const target = this.tables.find((t) => t.id === tableId);
    return target ? JSON.parse(JSON.stringify(target)) : null;
  }

  async changeTableStatus(tableId: string, newStatus: TableStatus, note?: string, changedBy = "Host Stand"): Promise<RestaurantTable> {
    await new Promise((res) => setTimeout(res, 60));
    const target = this.tables.find((t) => t.id === tableId);
    if (!target) throw new Error(`Table ${tableId} not found`);

    const oldStatus = target.status;
    target.status = newStatus;
    target.updated_at = new Date().toISOString();

    if (newStatus === "available" || newStatus === "cleaning" || newStatus === "blocked") {
      if (newStatus === "available") {
        target.current_session = null;
      }
    }

    this.history.push({
      id: `thist-${Date.now()}`,
      table_id: target.id,
      old_status: oldStatus,
      new_status: newStatus,
      reservation_id: target.current_session?.reservationId || null,
      changed_by: changedBy,
      changed_at: new Date().toISOString(),
      note: note || `Status transitioned to ${newStatus.toUpperCase()}`,
    });

    return JSON.parse(JSON.stringify(target));
  }

  async seatReservation(tableId: string, reservationId: string, guestData: SeatReservationInput): Promise<RestaurantTable> {
    await new Promise((res) => setTimeout(res, 80));
    const target = this.tables.find((t) => t.id === tableId);
    if (!target) throw new Error(`Table ${tableId} not found`);

    const nowTimeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    target.status = "seated";
    target.current_session = {
      reservationId,
      guestName: guestData.guestName,
      phone: guestData.phone,
      partySize: guestData.partySize,
      seatedAt: nowTimeStr,
      elapsedMinutes: 0,
      expectedDurationMinutes: guestData.expectedDurationMinutes || 90,
      specialOccasion: guestData.specialOccasion,
      allergies: guestData.allergies,
      dietaryNotes: guestData.dietaryNotes,
      serverName: "Floor Team",
    };
    target.updated_at = new Date().toISOString();

    return JSON.parse(JSON.stringify(target));
  }

  async seatWalkIn(tableId: string, guestData: SeatWalkInInput): Promise<RestaurantTable> {
    await new Promise((res) => setTimeout(res, 80));
    const target = this.tables.find((t) => t.id === tableId);
    if (!target) throw new Error(`Table ${tableId} not found`);

    const nowTimeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    target.status = "seated";
    target.current_session = {
      reservationId: `walkin-${Date.now()}`,
      guestName: guestData.guestName,
      phone: guestData.phone || "Walk-In Guest",
      partySize: guestData.partySize,
      seatedAt: nowTimeStr,
      elapsedMinutes: 0,
      expectedDurationMinutes: guestData.expectedDurationMinutes || 75,
      specialOccasion: guestData.specialOccasion || "Walk-In Dining",
      dietaryNotes: guestData.notes,
      serverName: "Host Stand",
    };
    target.updated_at = new Date().toISOString();

    return JSON.parse(JSON.stringify(target));
  }

  async moveParty(fromTableId: string, toTableId: string): Promise<{ fromTable: RestaurantTable; toTable: RestaurantTable }> {
    await new Promise((res) => setTimeout(res, 90));
    const fromTable = this.tables.find((t) => t.id === fromTableId);
    const toTable = this.tables.find((t) => t.id === toTableId);

    if (!fromTable) throw new Error(`Source table ${fromTableId} not found`);
    if (!toTable) throw new Error(`Target table ${toTableId} not found`);

    const session = fromTable.current_session;
    if (!session) throw new Error(`Table ${fromTable.table_number} has no active guest session to move`);

    toTable.current_session = session;
    toTable.status = "seated";
    toTable.updated_at = new Date().toISOString();

    fromTable.current_session = null;
    fromTable.status = "cleaning";
    fromTable.updated_at = new Date().toISOString();

    return {
      fromTable: JSON.parse(JSON.stringify(fromTable)),
      toTable: JSON.parse(JSON.stringify(toTable)),
    };
  }

  async markCleaning(tableId: string): Promise<RestaurantTable> {
    return this.changeTableStatus(tableId, "cleaning", "Table cleared; sanitizing in progress");
  }

  async markAvailable(tableId: string): Promise<RestaurantTable> {
    return this.changeTableStatus(tableId, "available", "Table ready for immediate seating");
  }

  async blockTable(tableId: string, reason?: string): Promise<RestaurantTable> {
    return this.changeTableStatus(tableId, "blocked", reason || "Table held/blocked by manager");
  }

  async getFloorSummary(_outletId?: string): Promise<FloorSummary> {
    await new Promise((res) => setTimeout(res, 40));
    const totalTables = this.tables.length;
    const availableCount = this.tables.filter((t) => t.status === "available").length;
    const reservedCount = this.tables.filter((t) => t.status === "reserved").length;
    const arrivingCount = this.tables.filter((t) => t.status === "arriving").length;
    const seatedCount = this.tables.filter((t) => t.status === "seated").length;
    const diningCount = this.tables.filter((t) => t.status === "dining" || t.status === "ordering").length;
    const billRequestedCount = this.tables.filter((t) => t.status === "bill_requested").length;
    const cleaningCount = this.tables.filter((t) => t.status === "cleaning").length;
    const blockedCount = this.tables.filter((t) => t.status === "blocked").length;

    const totalCapacity = this.tables.reduce((acc, t) => acc + t.capacity, 0);
    const occupiedCapacity = this.tables
      .filter((t) => t.status === "seated" || t.status === "dining" || t.status === "ordering" || t.status === "bill_requested")
      .reduce((acc, t) => acc + (t.current_session?.partySize || t.capacity), 0);

    const occupancyRatePercent = totalCapacity > 0 ? Math.round((occupiedCapacity / totalCapacity) * 100) : 0;

    return {
      totalTables,
      availableCount,
      reservedCount,
      arrivingCount,
      seatedCount,
      diningCount,
      billRequestedCount,
      cleaningCount,
      blockedCount,
      totalCapacity,
      occupiedCapacity,
      occupancyRatePercent,
    };
  }
}

export const floorService: IFloorService = new FixtureFloorService();
