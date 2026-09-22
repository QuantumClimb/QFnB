export type ReservationStatus = 
  | "new" 
  | "contacted" 
  | "confirmed" 
  | "arrived" 
  | "seated" 
  | "completed" 
  | "cancelled" 
  | "no_show";

export type BookingSource = 
  | "staff" 
  | "phone" 
  | "whatsapp" 
  | "walk_in" 
  | "website" 
  | "q_restobar" 
  | "hotel_concierge" 
  | "google" 
  | "other";

export type DepositStatus = 
  | "not_required" 
  | "pending" 
  | "paid" 
  | "refunded";

export interface SeatingArea {
  id: string;
  organization_id: string;
  outlet_id: string;
  name: string;
  description?: string;
  capacity: number;
  is_active: boolean;
  display_order: number;
}

export interface ReservationStatusHistoryItem {
  id: string;
  reservation_id: string;
  old_status?: ReservationStatus | null;
  new_status: ReservationStatus;
  changed_by?: string | null;
  changed_at: string;
  note?: string | null;
}

export interface Reservation {
  id: string;
  organization_id: string;
  outlet_id: string;
  guest_id?: string | null;

  // Guest Details
  guest_name: string;
  phone: string;
  email?: string | null;
  whatsapp?: string | null;

  // Schedule & Party
  reservation_date: string; // YYYY-MM-DD
  reservation_time: string; // HH:mm
  party_size: number;

  // Seating & Table
  seating_area_id?: string | null;
  seating_area_name?: string | null;
  assigned_table_id?: string | null;
  assigned_table_label?: string | null;

  // Lifecycle & Source
  booking_source: BookingSource;
  status: ReservationStatus;

  // Hospitality Preferences
  special_occasion?: string | null;
  special_requests?: string | null;
  dietary_requirements?: string | null;
  allergies?: string | null;

  // Timing & Pacing
  expected_duration_minutes: number;

  // Financials
  deposit_status: DepositStatus;
  deposit_amount?: number | null;

  // External Interoperability & Audit
  external_reference?: string | null;
  external_request_id?: string | null;
  reservation_token: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;

  // Nested Audit History
  status_history?: ReservationStatusHistoryItem[];
}

export interface CreateReservationInput {
  guest_name: string;
  phone: string;
  email?: string | null;
  whatsapp?: string | null;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  seating_area_id?: string | null;
  assigned_table_label?: string | null;
  booking_source?: BookingSource;
  special_occasion?: string | null;
  special_requests?: string | null;
  dietary_requirements?: string | null;
  allergies?: string | null;
  expected_duration_minutes?: number;
  deposit_status?: DepositStatus;
  deposit_amount?: number | null;
}

export interface UpdateReservationInput extends Partial<CreateReservationInput> {
  status?: ReservationStatus;
  assigned_table_id?: string | null;
  assigned_table_label?: string | null;
  note?: string;
}

export type ReservationViewMode = "today" | "upcoming" | "all";

export interface ReservationFilterCriteria {
  viewMode: ReservationViewMode;
  searchQuery: string;
  date?: string;
  status?: ReservationStatus | "all";
  seatingAreaId?: string | "all";
  bookingSource?: BookingSource | "all";
  minPartySize?: number;
}

// Availability Foundation Types
export interface AvailabilityQuery {
  outlet_id: string;
  date: string; // YYYY-MM-DD
  party_size: number;
  preferred_area_id?: string;
  requested_time?: string; // HH:mm
  expected_duration_minutes?: number;
}

export interface TimeSlotAvailability {
  time: string; // HH:mm
  is_available: boolean;
  seating_area_id?: string;
  seating_area_name?: string;
  suggested_table?: string;
  remaining_capacity: number;
  confidence: "high" | "limited" | "waitlist_only";
}

export interface AvailabilityResult {
  date: string;
  party_size: number;
  slots: TimeSlotAvailability[];
  capacity_warnings?: string[];
  smart_recommendations?: string[];
}
