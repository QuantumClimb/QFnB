export type TableStatus = 
  | "available" 
  | "reserved" 
  | "arriving" 
  | "seated" 
  | "ordering" 
  | "dining" 
  | "bill_requested" 
  | "cleaning" 
  | "blocked";

export type TableShape = 
  | "round" 
  | "square" 
  | "rectangle" 
  | "booth" 
  | "bar";

export interface CurrentGuestSession {
  reservationId?: string | null;
  guestName: string;
  phone?: string | null;
  partySize: number;
  seatedAt: string; // HH:mm or ISO
  elapsedMinutes: number;
  expectedDurationMinutes: number;
  specialOccasion?: string | null;
  allergies?: string | null;
  dietaryNotes?: string | null;
  serverName?: string | null;
  orderSummaryPlaceholder?: string | null;
}

export interface NextReservationInfo {
  reservationId: string;
  guestName: string;
  partySize: number;
  reservationTime: string; // HH:mm
  depositStatus?: string | null;
  specialOccasion?: string | null;
}

export interface RestaurantTable {
  id: string;
  organization_id: string;
  outlet_id: string;
  seating_area_id: string;
  seating_area_name?: string;

  table_number: string;
  display_name?: string | null;

  capacity: number;
  minimum_party_size: number;
  maximum_party_size: number;

  shape: TableShape;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  rotation: number;

  status: TableStatus;
  is_active: boolean;
  is_combinable: boolean;

  current_session?: CurrentGuestSession | null;
  next_reservation?: NextReservationInfo | null;

  created_at: string;
  updated_at: string;
}

export interface TableStateHistoryItem {
  id: string;
  table_id: string;
  old_status?: TableStatus | null;
  new_status: TableStatus;
  reservation_id?: string | null;
  changed_by?: string | null;
  changed_at: string;
  note?: string | null;
}

export interface FloorSeatingArea {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  tablesCount?: number;
  is_active: boolean;
}

export interface FloorSummary {
  totalTables: number;
  availableCount: number;
  reservedCount: number;
  arrivingCount: number;
  seatedCount: number;
  diningCount: number;
  billRequestedCount: number;
  cleaningCount: number;
  blockedCount: number;
  totalCapacity: number;
  occupiedCapacity: number;
  occupancyRatePercent: number;
}

export interface SmartAvailabilityQuery {
  outlet_id?: string;
  party_size: number;
  preferred_area_id?: string | "all";
  current_time?: string; // HH:mm
  minimum_duration_minutes?: number; // default 75m
  cleaning_buffer_minutes?: number; // default 15m
}

export interface SmartAvailabilityWindow {
  table_id: string;
  table_number: string;
  seating_area_name: string;
  capacity: number;
  shape: TableShape;
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  window_duration_minutes: number;
  suggested_dining_duration_minutes: number;
  next_reservation_time?: string | null;
  cleaning_buffer_minutes: number;
  status: "immediate" | "upcoming_turn" | "tight_window";
  reason: string;
}

// Strongly typed inputs for Floor Operations (replacing any)
export interface SeatReservationInput {
  guestName: string;
  partySize: number;
  phone?: string | null;
  specialOccasion?: string | null;
  allergies?: string | null;
  dietaryNotes?: string | null;
  expectedDurationMinutes?: number;
}

export interface SeatWalkInInput {
  guestName: string;
  partySize: number;
  phone?: string | null;
  specialOccasion?: string | null;
  notes?: string | null;
  allergies?: string | null;
  dietaryNotes?: string | null;
  expectedDurationMinutes?: number;
}

export interface MovePartyInput {
  fromTableId: string;
  toTableId: string;
}
