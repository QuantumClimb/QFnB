import type {
  RestaurantTable,
  FloorSeatingArea,
  FloorSummary,
  TableStatus,
  SeatReservationInput,
  SeatWalkInInput,
} from "../types";

export interface IFloorService {
  listSeatingAreas(outletId?: string): Promise<FloorSeatingArea[]>;
  listTables(outletId?: string, areaId?: string): Promise<RestaurantTable[]>;
  getTable(tableId: string): Promise<RestaurantTable | null>;
  changeTableStatus(tableId: string, newStatus: TableStatus, note?: string, changedBy?: string): Promise<RestaurantTable>;
  seatReservation(tableId: string, reservationId: string, guestData: SeatReservationInput): Promise<RestaurantTable>;
  seatWalkIn(tableId: string, guestData: SeatWalkInInput): Promise<RestaurantTable>;
  moveParty(fromTableId: string, toTableId: string): Promise<{ fromTable: RestaurantTable; toTable: RestaurantTable }>;
  markCleaning(tableId: string): Promise<RestaurantTable>;
  markAvailable(tableId: string): Promise<RestaurantTable>;
  blockTable(tableId: string, reason?: string): Promise<RestaurantTable>;
  getFloorSummary(outletId?: string): Promise<FloorSummary>;
}
