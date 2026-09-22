import {
  Guest,
  GuestVisit,
  CreateGuestInput,
  UpdateGuestInput,
  GuestFilterOptions,
  GuestSummaryMetrics,
  DuplicateMatchResult,
  GuestUpcomingReservationPreview,
  GuestRecentOrderPreview
} from "../types";
import { initialGuestFixtures, initialGuestVisits } from "../fixtures/guestFixtures";
import { reservationService, IReservationService } from "../../reservations/services/reservationService";
import { orderService, IOrderService } from "../../orders/services/orderService";

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

export function normalizeContact(val?: string | null, type: "phone" | "email" = "phone"): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (!trimmed) return null;

  if (type === "email") {
    return trimmed.toLowerCase();
  }

  // Strip spaces, dashes, parentheses, dots
  const cleaned = trimmed.replace(/[^0-9+]/g, "");
  return cleaned || null;
}

export class FixtureGuestService implements IGuestService {
  private guests: Guest[];
  private visits: GuestVisit[];
  private resSvc: IReservationService;
  private ordSvc: IOrderService;

  constructor(customResSvc?: IReservationService, customOrdSvc?: IOrderService) {
    this.guests = JSON.parse(JSON.stringify(initialGuestFixtures));
    this.visits = JSON.parse(JSON.stringify(initialGuestVisits));
    this.resSvc = customResSvc || reservationService;
    this.ordSvc = customOrdSvc || orderService;
  }

  async listGuests(_orgId?: string, options?: GuestFilterOptions): Promise<Guest[]> {
    await new Promise((res) => setTimeout(res, 40));
    let result = this.guests.filter((g) => g.is_active);

    if (!options) return result;

    // View Mode Filters
    if (options.viewMode && options.viewMode !== "ALL") {
      switch (options.viewMode) {
        case "VIP":
          result = result.filter((g) => g.is_vip);
          break;
        case "RETURNING":
          result = result.filter((g) => g.visit_count >= 2);
          break;
        case "UPCOMING":
          result = result.filter((g) => g.last_reservation_at !== null || g.tags.some((t) => t.includes("BIRTHDAY") || t.includes("ANNIVERSARY")));
          break;
        case "RECENT":
          result = result.filter((g) => g.last_visit_at !== null);
          break;
      }
    }

    // Search Query (Name, Phone, Email)
    if (options.searchQuery && options.searchQuery.trim()) {
      const q = options.searchQuery.toLowerCase().trim();
      const qNorm = normalizeContact(q, "phone") || q;
      result = result.filter((g) => {
        const fullName = `${g.first_name} ${g.last_name}`.toLowerCase();
        const dispName = (g.display_name || "").toLowerCase();
        const email = (g.email || "").toLowerCase();
        const phone = (g.phone || "").toLowerCase();
        const phoneNorm = (g.phone_normalized || "");
        return (
          fullName.includes(q) ||
          dispName.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          phoneNorm.includes(qNorm)
        );
      });
    }

    // Tag Filter
    if (options.tag && options.tag !== "ALL") {
      result = result.filter((g) => g.tags.includes(options.tag!));
    }

    // Min Visits
    if (options.minVisits !== undefined && options.minVisits > 0) {
      result = result.filter((g) => g.visit_count >= options.minVisits!);
    }

    // Allergies Filter
    if (options.hasAllergies) {
      result = result.filter((g) => g.allergies.length > 0);
    }

    // Sorting
    const sortField = options.sortBy || "last_visit";
    const direction = options.sortDirection || "desc";

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === "last_visit") {
        const timeA = a.last_visit_at ? new Date(a.last_visit_at).getTime() : 0;
        const timeB = b.last_visit_at ? new Date(b.last_visit_at).getTime() : 0;
        comparison = timeA - timeB;
      } else if (sortField === "visit_count") {
        comparison = a.visit_count - b.visit_count;
      } else if (sortField === "name") {
        comparison = `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`);
      } else if (sortField === "created_at") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }

      return direction === "desc" ? -comparison : comparison;
    });

    return result;
  }

  async getGuest(guestId: string): Promise<Guest | null> {
    await new Promise((res) => setTimeout(res, 30));
    const guest = this.guests.find((g) => g.id === guestId && g.is_active);
    return guest ? JSON.parse(JSON.stringify(guest)) : null;
  }

  async createGuest(input: CreateGuestInput, orgId: string = "org-001"): Promise<Guest> {
    await new Promise((res) => setTimeout(res, 60));

    const phoneNorm = normalizeContact(input.phone, "phone");
    const whatsappNorm = normalizeContact(input.whatsapp || input.phone, "phone");
    const emailNorm = normalizeContact(input.email, "email");
    const nowIso = new Date().toISOString();

    const newGuest: Guest = {
      id: `gst-${Date.now().toString().slice(-4)}`,
      organization_id: orgId,
      first_name: input.first_name.trim(),
      last_name: input.last_name.trim(),
      display_name: input.display_name?.trim() || `${input.first_name.trim()} ${input.last_name.trim()}`,
      phone: input.phone?.trim() || null,
      phone_normalized: phoneNorm,
      whatsapp: input.whatsapp?.trim() || input.phone?.trim() || null,
      whatsapp_normalized: whatsappNorm,
      email: input.email?.trim() || null,
      email_normalized: emailNorm,
      date_of_birth: input.date_of_birth || null,
      anniversary_date: input.anniversary_date || null,
      preferred_language: input.preferred_language || "en",
      preferred_outlet_id: input.preferred_outlet_id || "out-001",
      preferred_outlet_name: "Quantum Climb",
      preferred_seating_area_id: input.preferred_seating_area_id || null,
      preferred_seating_area_name: input.preferred_seating_area_id === "area-terrace" ? "Alfresco Terrace" : input.preferred_seating_area_id === "area-bar" ? "Cocktail Bar" : input.preferred_seating_area_id === "area-pdr" ? "Private Dining Suite" : "Main Dining",
      preferred_table_id: input.preferred_table_id || null,
      preferred_table_number: null,
      dietary_requirements: input.dietary_requirements || [],
      allergies: input.allergies || [],
      hospitality_notes: input.hospitality_notes?.trim() || null,
      tags: input.tags || (input.is_vip ? ["VIP"] : ["NEW_GUEST"]),
      visit_count: 0,
      first_visit_at: null,
      last_visit_at: null,
      last_reservation_at: null,
      is_vip: input.is_vip || false,
      is_active: true,
      marketing_email_opt_in: input.marketing_email_opt_in || false,
      marketing_whatsapp_opt_in: input.marketing_whatsapp_opt_in || false,
      marketing_sms_opt_in: input.marketing_sms_opt_in || false,
      created_at: nowIso,
      updated_at: nowIso,
    };

    this.guests.unshift(newGuest);
    return JSON.parse(JSON.stringify(newGuest));
  }

  async updateGuest(guestId: string, input: UpdateGuestInput): Promise<Guest> {
    await new Promise((res) => setTimeout(res, 50));
    const guest = this.guests.find((g) => g.id === guestId);
    if (!guest) throw new Error(`Guest ${guestId} not found`);

    if (input.first_name !== undefined) guest.first_name = input.first_name.trim();
    if (input.last_name !== undefined) guest.last_name = input.last_name.trim();
    if (input.display_name !== undefined) guest.display_name = input.display_name?.trim() || null;

    if (input.phone !== undefined) {
      guest.phone = input.phone?.trim() || null;
      guest.phone_normalized = normalizeContact(input.phone, "phone");
    }

    if (input.whatsapp !== undefined) {
      guest.whatsapp = input.whatsapp?.trim() || null;
      guest.whatsapp_normalized = normalizeContact(input.whatsapp, "phone");
    }

    if (input.email !== undefined) {
      guest.email = input.email?.trim() || null;
      guest.email_normalized = normalizeContact(input.email, "email");
    }

    if (input.date_of_birth !== undefined) guest.date_of_birth = input.date_of_birth || null;
    if (input.anniversary_date !== undefined) guest.anniversary_date = input.anniversary_date || null;
    if (input.preferred_language !== undefined) guest.preferred_language = input.preferred_language;
    if (input.preferred_seating_area_id !== undefined) {
      guest.preferred_seating_area_id = input.preferred_seating_area_id || null;
      guest.preferred_seating_area_name = input.preferred_seating_area_id === "area-terrace" ? "Alfresco Terrace" : input.preferred_seating_area_id === "area-bar" ? "Cocktail Bar" : input.preferred_seating_area_id === "area-pdr" ? "Private Dining Suite" : "Main Dining";
    }

    if (input.dietary_requirements !== undefined) guest.dietary_requirements = input.dietary_requirements;
    if (input.allergies !== undefined) guest.allergies = input.allergies;
    if (input.hospitality_notes !== undefined) guest.hospitality_notes = input.hospitality_notes?.trim() || null;
    if (input.tags !== undefined) guest.tags = input.tags;
    if (input.is_vip !== undefined) guest.is_vip = input.is_vip;
    if (input.is_active !== undefined) guest.is_active = input.is_active;

    if (input.marketing_email_opt_in !== undefined) guest.marketing_email_opt_in = input.marketing_email_opt_in;
    if (input.marketing_whatsapp_opt_in !== undefined) guest.marketing_whatsapp_opt_in = input.marketing_whatsapp_opt_in;
    if (input.marketing_sms_opt_in !== undefined) guest.marketing_sms_opt_in = input.marketing_sms_opt_in;

    guest.updated_at = new Date().toISOString();
    return JSON.parse(JSON.stringify(guest));
  }

  async findPotentialMatches(
    phone?: string,
    email?: string,
    whatsapp?: string,
    _orgId?: string
  ): Promise<DuplicateMatchResult> {
    await new Promise((res) => setTimeout(res, 20));

    const normPhone = normalizeContact(phone, "phone");
    const normWhatsapp = normalizeContact(whatsapp, "phone");
    const normEmail = normalizeContact(email, "email");

    if (!normPhone && !normWhatsapp && !normEmail) {
      return { hasMatch: false, confidence: "none" };
    }

    for (const g of this.guests) {
      if (!g.is_active) continue;

      if (normPhone && g.phone_normalized && g.phone_normalized === normPhone) {
        return {
          hasMatch: true,
          matchType: "phone",
          matchedGuest: JSON.parse(JSON.stringify(g)),
          confidence: "exact",
        };
      }

      if (normWhatsapp && g.whatsapp_normalized && g.whatsapp_normalized === normWhatsapp) {
        return {
          hasMatch: true,
          matchType: "whatsapp",
          matchedGuest: JSON.parse(JSON.stringify(g)),
          confidence: "exact",
        };
      }

      if (normEmail && g.email_normalized && g.email_normalized === normEmail) {
        return {
          hasMatch: true,
          matchType: "email",
          matchedGuest: JSON.parse(JSON.stringify(g)),
          confidence: "exact",
        };
      }
    }

    return { hasMatch: false, confidence: "none" };
  }

  async getGuestVisits(guestId: string): Promise<GuestVisit[]> {
    await new Promise((res) => setTimeout(res, 30));
    const list = this.visits.filter((v) => v.guest_id === guestId);
    list.sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
    return JSON.parse(JSON.stringify(list));
  }

  async getUpcomingReservations(guestId: string): Promise<GuestUpcomingReservationPreview[]> {
    await new Promise((res) => setTimeout(res, 30));
    const guest = this.guests.find((g) => g.id === guestId);
    if (!guest) return [];

    try {
      // Query reservation service adapter
      const allReservations = await this.resSvc.listReservations();
      const guestReservations = allReservations.filter((r) => {
        const matchesGuestId = r.guest_id === guestId;
        const matchesGuestName = r.guest_name && (
          r.guest_name.toLowerCase() === guest.first_name.toLowerCase() ||
          r.guest_name.toLowerCase() === guest.display_name?.toLowerCase() ||
          r.guest_name.toLowerCase() === `${guest.first_name} ${guest.last_name}`.toLowerCase()
        );
        const isUpcoming = r.status === "confirmed" || r.status === "arrived";
        return (matchesGuestId || matchesGuestName) && isUpcoming;
      });

      return guestReservations.map((r) => ({
        id: r.id,
        reservation_date: r.reservation_date,
        reservation_time: r.reservation_time,
        party_size: r.party_size,
        outlet_name: "Quantum Climb",
        seating_area_name: r.seating_area_name || "Dining Area",
        status: r.status,
      }));
    } catch (err) {
      console.warn("Could not query reservation service adapter:", err);
      return [];
    }
  }

  async getRecentOrders(guestId: string): Promise<GuestRecentOrderPreview[]> {
    await new Promise((res) => setTimeout(res, 30));
    const guest = this.guests.find((g) => g.id === guestId);
    if (!guest) return [];

    try {
      // Query order service adapter
      const allOrders = await this.ordSvc.listOrders();
      const guestOrders = allOrders.filter((o) => {
        const matchesName = o.guest_name && (
          o.guest_name.toLowerCase().includes(guest.first_name.toLowerCase()) ||
          o.guest_name.toLowerCase().includes(guest.last_name.toLowerCase())
        );
        return matchesName;
      });

      return guestOrders.slice(0, 3).map((o) => ({
        id: o.id,
        order_number: o.order_number,
        opened_at: o.opened_at,
        table_number: o.table_number || "W/I",
        dishes: o.items.map((i) => i.item_name),
      }));
    } catch (err) {
      console.warn("Could not query order service adapter:", err);
      return [];
    }
  }

  async addTag(guestId: string, tag: string): Promise<Guest> {
    const guest = this.guests.find((g) => g.id === guestId);
    if (!guest) throw new Error(`Guest ${guestId} not found`);

    const cleanTag = tag.trim().toUpperCase().replace(/\s+/g, "_");
    if (!guest.tags.includes(cleanTag)) {
      guest.tags.push(cleanTag);
      if (cleanTag === "VIP") guest.is_vip = true;
      guest.updated_at = new Date().toISOString();
    }

    return JSON.parse(JSON.stringify(guest));
  }

  async removeTag(guestId: string, tag: string): Promise<Guest> {
    const guest = this.guests.find((g) => g.id === guestId);
    if (!guest) throw new Error(`Guest ${guestId} not found`);

    guest.tags = guest.tags.filter((t) => t !== tag);
    if (tag === "VIP") guest.is_vip = false;
    guest.updated_at = new Date().toISOString();

    return JSON.parse(JSON.stringify(guest));
  }

  async addHospitalityNote(guestId: string, note: string): Promise<Guest> {
    const guest = this.guests.find((g) => g.id === guestId);
    if (!guest) throw new Error(`Guest ${guestId} not found`);

    const existing = guest.hospitality_notes ? guest.hospitality_notes + "\n" : "";
    guest.hospitality_notes = existing + note.trim();
    guest.updated_at = new Date().toISOString();

    return JSON.parse(JSON.stringify(guest));
  }

  async getGuestSummary(_orgId?: string): Promise<GuestSummaryMetrics> {
    await new Promise((res) => setTimeout(res, 20));

    const active = this.guests.filter((g) => g.is_active);
    const returning = active.filter((g) => g.visit_count >= 2);
    const vips = active.filter((g) => g.is_vip);
    const allergyAlerts = active.filter((g) => g.allergies.length > 0);
    const upcomingOccasions = active.filter((g) =>
      g.last_reservation_at !== null ||
      g.tags.some((t) => t.includes("BIRTHDAY") || t.includes("ANNIVERSARY"))
    );

    return {
      totalGuestsCount: active.length,
      returningGuestsCount: returning.length,
      vipGuestsCount: vips.length,
      upcomingOccasionsCount: upcomingOccasions.length,
      allergyAlertsCount: allergyAlerts.length,
    };
  }
}

export const guestService: IGuestService = new FixtureGuestService();
