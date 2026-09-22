export type GuestViewMode =
  | "ALL"
  | "RETURNING"
  | "VIP"
  | "UPCOMING"
  | "RECENT";

export interface Guest {
  id: string;
  organization_id: string;
  
  first_name: string;
  last_name: string;
  display_name?: string | null;
  
  phone?: string | null;
  phone_normalized?: string | null;
  
  whatsapp?: string | null;
  whatsapp_normalized?: string | null;
  
  email?: string | null;
  email_normalized?: string | null;
  
  date_of_birth?: string | null;
  anniversary_date?: string | null;
  
  preferred_language?: string;
  
  preferred_outlet_id?: string | null;
  preferred_outlet_name?: string | null;
  preferred_seating_area_id?: string | null;
  preferred_seating_area_name?: string | null;
  preferred_table_id?: string | null;
  preferred_table_number?: string | null;
  
  dietary_requirements: string[];
  allergies: string[];
  
  hospitality_notes?: string | null;
  tags: string[];
  
  visit_count: number;
  first_visit_at?: string | null;
  last_visit_at?: string | null;
  last_reservation_at?: string | null;
  
  is_vip: boolean;
  is_active: boolean;
  
  marketing_email_opt_in: boolean;
  marketing_whatsapp_opt_in: boolean;
  marketing_sms_opt_in: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface GuestVisit {
  id: string;
  organization_id: string;
  outlet_id: string;
  outlet_name?: string;
  guest_id: string;
  
  reservation_id?: string | null;
  order_id?: string | null;
  
  visit_date: string;
  arrival_at?: string | null;
  seated_at?: string | null;
  completed_at?: string | null;
  
  party_size?: number | null;
  seating_area_id?: string | null;
  seating_area_name?: string | null;
  table_id?: string | null;
  table_number?: string | null;
  
  occasion?: string | null;
  service_notes?: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface CreateGuestInput {
  first_name: string;
  last_name: string;
  display_name?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  date_of_birth?: string;
  anniversary_date?: string;
  preferred_language?: string;
  preferred_outlet_id?: string;
  preferred_seating_area_id?: string;
  preferred_table_id?: string;
  dietary_requirements?: string[];
  allergies?: string[];
  hospitality_notes?: string;
  tags?: string[];
  is_vip?: boolean;
  marketing_email_opt_in?: boolean;
  marketing_whatsapp_opt_in?: boolean;
  marketing_sms_opt_in?: boolean;
}

export interface UpdateGuestInput extends Partial<CreateGuestInput> {
  is_active?: boolean;
}

export interface GuestFilterOptions {
  searchQuery?: string;
  viewMode?: GuestViewMode;
  tag?: string;
  outletId?: string;
  minVisits?: number;
  hasAllergies?: boolean;
  hasUpcomingBooking?: boolean;
  sortBy?: "last_visit" | "visit_count" | "name" | "created_at";
  sortDirection?: "asc" | "desc";
}

export interface GuestSummaryMetrics {
  totalGuestsCount: number;
  returningGuestsCount: number;
  vipGuestsCount: number;
  upcomingOccasionsCount: number;
  allergyAlertsCount: number;
}

export interface DuplicateMatchResult {
  hasMatch: boolean;
  matchType?: "phone" | "whatsapp" | "email";
  matchedGuest?: Guest;
  confidence: "exact" | "none";
}

export interface GuestUpcomingReservationPreview {
  id: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  outlet_name: string;
  seating_area_name?: string;
  status: string;
}

export interface GuestRecentOrderPreview {
  id: string;
  order_number: string;
  opened_at: string;
  table_number: string;
  dishes: string[];
}
