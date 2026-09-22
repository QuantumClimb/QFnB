// Domain Types for Offers & Experiences Engine (Phase 3H)

export type ExperienceCategory =
  | "celebration"
  | "romantic"
  | "private_dining"
  | "tasting"
  | "wine"
  | "live_entertainment"
  | "corporate"
  | "family"
  | "seasonal"
  | "other";

export type ExperienceStatus =
  | "draft"
  | "active"
  | "paused"
  | "expired"
  | "archived";

export type AddonCategory =
  | "food"
  | "beverage"
  | "decor"
  | "celebration"
  | "personalization"
  | "service"
  | "other";

export type OfferStatus =
  | "draft"
  | "active"
  | "paused"
  | "expired"
  | "archived";

export type ReservationExperienceStatus =
  | "pending"
  | "confirmed"
  | "fulfilled"
  | "cancelled";

export interface ExperienceAvailabilityRule {
  id: string;
  organization_id: string;
  outlet_id?: string | null;
  experience_id: string;
  day_of_week: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  is_active: boolean;
  maximum_bookings?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Experience {
  id: string;
  organization_id: string;
  outlet_id?: string | null; // null = Org-wide catalogue
  outlet_name?: string | null;

  title: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;

  category: ExperienceCategory;
  status: ExperienceStatus;

  is_public: boolean;
  is_featured: boolean;

  minimum_party_size: number;
  maximum_party_size: number;

  duration_minutes?: number | null;

  base_price?: number | null;
  currency_code: string;

  preferred_seating_area_id?: string | null;
  preferred_seating_area_name?: string | null;

  valid_from?: string | null;
  valid_until?: string | null;

  booking_lead_minutes?: number | null;

  guest_terms?: string | null;
  internal_notes?: string | null;

  image_url?: string | null;

  availability_rules?: ExperienceAvailabilityRule[];
  upcoming_bookings_count?: number;

  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExperienceAddon {
  id: string;
  organization_id: string;
  outlet_id?: string | null; // null = Org-wide
  outlet_name?: string | null;

  experience_id?: string | null; // null = Available to all
  experience_title?: string | null;

  name: string;
  description?: string | null;
  category: AddonCategory;

  price?: number | null;
  currency_code: string;

  is_public: boolean;
  is_active: boolean;

  maximum_quantity?: number | null;

  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: string;
  organization_id: string;
  outlet_id?: string | null;
  outlet_name?: string | null;

  title: string;
  short_description?: string | null;
  description?: string | null;

  status: OfferStatus;

  is_public: boolean;
  is_featured: boolean;

  valid_from?: string | null;
  valid_until?: string | null;

  experience_id?: string | null;
  experience_title?: string | null;

  eligibility_notes?: string | null;
  redemption_notes?: string | null;
  internal_notes?: string | null;

  image_url?: string | null;

  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReservationExperience {
  id: string;
  organization_id: string;
  outlet_id: string;

  reservation_id: string;
  experience_id: string;
  experience_title?: string;
  experience_category?: ExperienceCategory;

  status: ReservationExperienceStatus;
  quantity: number;

  unit_price_snapshot?: number | null;
  currency_code: string;

  guest_notes?: string | null;
  staff_notes?: string | null;

  guest_name?: string;
  reservation_date?: string;
  reservation_time?: string;
  party_size?: number;

  added_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReservationAddon {
  id: string;
  organization_id: string;
  outlet_id: string;

  reservation_id: string;
  experience_id?: string | null;
  addon_id: string;
  addon_name?: string;
  addon_category?: AddonCategory;

  quantity: number;

  unit_price_snapshot?: number | null;
  currency_code: string;

  notes?: string | null;

  guest_name?: string;
  reservation_date?: string;

  added_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateExperienceInput {
  organization_id: string;
  outlet_id?: string | null;
  title: string;
  slug?: string;
  short_description?: string | null;
  description?: string | null;
  category: ExperienceCategory;
  is_public: boolean;
  is_featured?: boolean;
  minimum_party_size: number;
  maximum_party_size: number;
  duration_minutes?: number | null;
  base_price?: number | null;
  currency_code?: string;
  preferred_seating_area_id?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  booking_lead_minutes?: number | null;
  guest_terms?: string | null;
  internal_notes?: string | null;
  image_url?: string | null;
  availability_days?: number[]; // [0,1,2,3,4,5,6]
  start_time?: string;
  end_time?: string;
}

export interface UpdateExperienceInput {
  title?: string;
  short_description?: string | null;
  description?: string | null;
  category?: ExperienceCategory;
  status?: ExperienceStatus;
  is_public?: boolean;
  is_featured?: boolean;
  minimum_party_size?: number;
  maximum_party_size?: number;
  duration_minutes?: number | null;
  base_price?: number | null;
  preferred_seating_area_id?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  booking_lead_minutes?: number | null;
  guest_terms?: string | null;
  internal_notes?: string | null;
  image_url?: string | null;
}

export interface CreateAddonInput {
  organization_id: string;
  outlet_id?: string | null;
  experience_id?: string | null;
  name: string;
  description?: string | null;
  category: AddonCategory;
  price?: number | null;
  currency_code?: string;
  is_public: boolean;
  is_active: boolean;
  maximum_quantity?: number | null;
}

export interface UpdateAddonInput {
  name?: string;
  description?: string | null;
  category?: AddonCategory;
  price?: number | null;
  is_public?: boolean;
  is_active?: boolean;
  maximum_quantity?: number | null;
}

export interface CreateOfferInput {
  organization_id: string;
  outlet_id?: string | null;
  title: string;
  short_description?: string | null;
  description?: string | null;
  status?: OfferStatus;
  is_public: boolean;
  is_featured?: boolean;
  valid_from?: string | null;
  valid_until?: string | null;
  experience_id?: string | null;
  eligibility_notes?: string | null;
  redemption_notes?: string | null;
  internal_notes?: string | null;
  image_url?: string | null;
}

export interface UpdateOfferInput {
  title?: string;
  short_description?: string | null;
  description?: string | null;
  status?: OfferStatus;
  is_public?: boolean;
  is_featured?: boolean;
  valid_from?: string | null;
  valid_until?: string | null;
  experience_id?: string | null;
  eligibility_notes?: string | null;
  redemption_notes?: string | null;
  internal_notes?: string | null;
}

export interface AttachExperienceInput {
  organization_id: string;
  outlet_id: string;
  reservation_id: string;
  experience_id: string;
  quantity?: number;
  guest_notes?: string | null;
  staff_notes?: string | null;
}

export interface AttachAddonInput {
  organization_id: string;
  outlet_id: string;
  reservation_id: string;
  addon_id: string;
  experience_id?: string | null;
  quantity?: number;
  notes?: string | null;
}

export interface ExperienceCompatibilityResult {
  isCompatible: boolean;
  reasons: string[];
}

export interface OffersFilterOptions {
  searchQuery?: string;
  category?: string; // 'ALL' or specific
  status?: string; // 'ALL' or specific
  visibility?: "ALL" | "PUBLIC" | "STAFF_ONLY";
  scope?: "ALL" | "ORG_WIDE" | "CURRENT_OUTLET";
}

export interface OffersSummaryMetrics {
  activeExperiencesCount: number;
  activeOffersCount: number;
  upcomingExperienceBookingsCount: number;
  addonsAttachedTodayCount: number;
}

export type OffersTab = "EXPERIENCES" | "OFFERS" | "ADD_ONS" | "RESERVATION_BOOKINGS";
