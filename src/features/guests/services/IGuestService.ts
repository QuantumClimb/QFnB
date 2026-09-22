import type {
  Guest,
  GuestFilterOptions,
  CreateGuestInput,
  UpdateGuestInput,
  DuplicateMatchResult,
  GuestVisit,
  GuestUpcomingReservationPreview,
  GuestRecentOrderPreview,
  GuestSummaryMetrics,
} from "../types";

export interface IGuestService {
  listGuests(orgId?: string, options?: GuestFilterOptions): Promise<Guest[]>;
  getGuest(guestId: string): Promise<Guest | null>;
  createGuest(input: CreateGuestInput, orgId?: string): Promise<Guest>;
  updateGuest(guestId: string, input: UpdateGuestInput): Promise<Guest>;
  findPotentialMatches(phone?: string, email?: string, whatsapp?: string, orgId?: string): Promise<DuplicateMatchResult>;
  getGuestVisits(guestId: string): Promise<GuestVisit[]>;
  getUpcomingReservations(guestId: string): Promise<GuestUpcomingReservationPreview[]>;
  getRecentOrders(guestId: string): Promise<GuestRecentOrderPreview[]>;
  addTag(guestId: string, tag: string): Promise<Guest>;
  removeTag(guestId: string, tag: string): Promise<Guest>;
  addHospitalityNote(guestId: string, note: string): Promise<Guest>;
  getGuestSummary(orgId?: string): Promise<GuestSummaryMetrics>;
}
