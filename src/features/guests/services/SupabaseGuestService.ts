import { supabase } from "../../../lib/supabase";
import type { IGuestService } from "./IGuestService";
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

export class SupabaseGuestService implements IGuestService {
  async listGuests(orgId = "dev-org-001", options?: GuestFilterOptions): Promise<Guest[]> {
    let query = supabase.from("guests").select("*").eq("organization_id", orgId);

    if (options?.searchQuery) {
      const q = options.searchQuery.trim();
      query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);
    }
    if (options?.viewMode === "VIP") {
      query = query.eq("is_vip", true);
    }
    if (options?.hasAllergies) {
      query = query.not("allergies", "eq", "{}");
    }
    if (options?.minVisits) {
      query = query.gte("visit_count", options.minVisits);
    }

    const sortCol = options?.sortBy || "last_visit_at";
    const ascending = options?.sortDirection === "asc";
    const { data, error } = await query.order(sortCol, { ascending, nullsFirst: false });
    if (error) {
      console.error("[SupabaseGuestService] listGuests error:", error);
      return [];
    }

    return (data || []).map(this.mapToDomain);
  }

  async getGuest(guestId: string): Promise<Guest | null> {
    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .eq("id", guestId)
      .single();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async createGuest(input: CreateGuestInput, orgId = "dev-org-001"): Promise<Guest> {
    const row: Record<string, any> = {
      organization_id: orgId,
      first_name: input.first_name,
      last_name: input.last_name,
      display_name: input.display_name || null,
      phone: input.phone || null,
      phone_normalized: input.phone?.replace(/[^0-9+]/g, "") || null,
      email: input.email || null,
      email_normalized: input.email?.toLowerCase().trim() || null,
      whatsapp: input.whatsapp || null,
      whatsapp_normalized: input.whatsapp?.replace(/[^0-9+]/g, "") || null,
      date_of_birth: input.date_of_birth || null,
      anniversary_date: input.anniversary_date || null,
      preferred_language: input.preferred_language || "en",
      preferred_outlet_id: input.preferred_outlet_id || null,
      preferred_seating_area_id: input.preferred_seating_area_id || null,
      preferred_table_id: input.preferred_table_id || null,
      dietary_requirements: input.dietary_requirements || [],
      allergies: input.allergies || [],
      hospitality_notes: input.hospitality_notes || null,
      tags: input.tags || [],
      is_vip: input.is_vip ?? false,
      marketing_email_opt_in: input.marketing_email_opt_in ?? false,
      marketing_whatsapp_opt_in: input.marketing_whatsapp_opt_in ?? false,
      marketing_sms_opt_in: input.marketing_sms_opt_in ?? false,
    };

    const { data, error } = await supabase
      .from("guests")
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("[SupabaseGuestService] createGuest error:", error);
      throw error;
    }

    return this.mapToDomain(data);
  }

  async updateGuest(guestId: string, input: UpdateGuestInput): Promise<Guest> {
    const updates: Record<string, any> = {};
    if (input.first_name !== undefined) updates.first_name = input.first_name;
    if (input.last_name !== undefined) updates.last_name = input.last_name;
    if (input.display_name !== undefined) updates.display_name = input.display_name;
    if (input.phone !== undefined) {
      updates.phone = input.phone;
      updates.phone_normalized = input.phone ? input.phone.replace(/[^0-9+]/g, "") : null;
    }
    if (input.email !== undefined) {
      updates.email = input.email;
      updates.email_normalized = input.email ? input.email.toLowerCase().trim() : null;
    }
    if (input.whatsapp !== undefined) {
      updates.whatsapp = input.whatsapp;
      updates.whatsapp_normalized = input.whatsapp ? input.whatsapp.replace(/[^0-9+]/g, "") : null;
    }
    if (input.date_of_birth !== undefined) updates.date_of_birth = input.date_of_birth;
    if (input.anniversary_date !== undefined) updates.anniversary_date = input.anniversary_date;
    if (input.preferred_language !== undefined) updates.preferred_language = input.preferred_language;
    if (input.preferred_outlet_id !== undefined) updates.preferred_outlet_id = input.preferred_outlet_id;
    if (input.preferred_seating_area_id !== undefined) updates.preferred_seating_area_id = input.preferred_seating_area_id;
    if (input.preferred_table_id !== undefined) updates.preferred_table_id = input.preferred_table_id;
    if (input.dietary_requirements !== undefined) updates.dietary_requirements = input.dietary_requirements;
    if (input.allergies !== undefined) updates.allergies = input.allergies;
    if (input.hospitality_notes !== undefined) updates.hospitality_notes = input.hospitality_notes;
    if (input.tags !== undefined) updates.tags = input.tags;
    if (input.is_vip !== undefined) updates.is_vip = input.is_vip;
    if (input.is_active !== undefined) updates.is_active = input.is_active;
    if (input.marketing_email_opt_in !== undefined) updates.marketing_email_opt_in = input.marketing_email_opt_in;
    if (input.marketing_whatsapp_opt_in !== undefined) updates.marketing_whatsapp_opt_in = input.marketing_whatsapp_opt_in;
    if (input.marketing_sms_opt_in !== undefined) updates.marketing_sms_opt_in = input.marketing_sms_opt_in;

    const { data, error } = await supabase
      .from("guests")
      .update(updates)
      .eq("id", guestId)
      .select()
      .single();

    if (error) throw error;
    return this.mapToDomain(data);
  }

  async findPotentialMatches(phone?: string, email?: string, whatsapp?: string, orgId = "dev-org-001"): Promise<DuplicateMatchResult> {
    const normPhone = phone ? phone.replace(/[^0-9+]/g, "") : "";
    const normEmail = email ? email.toLowerCase().trim() : "";

    let query = supabase.from("guests").select("*").eq("organization_id", orgId);
    const conditions: string[] = [];
    if (normPhone) conditions.push(`phone_normalized.eq.${normPhone}`);
    if (normEmail) conditions.push(`email_normalized.eq.${normEmail}`);

    if (conditions.length === 0) return { hasMatch: false, confidence: "none" };

    query = query.or(conditions.join(","));
    const { data } = await query;
    const matches = (data || []).map(this.mapToDomain);

    if (matches.length > 0) {
      // Determine match type
      const matchedGuest = matches[0];
      let matchType: "phone" | "whatsapp" | "email" = "phone";
      if (normPhone && matchedGuest.phone_normalized === normPhone) matchType = "phone";
      else if (normEmail && matchedGuest.email_normalized === normEmail) matchType = "email";

      return {
        hasMatch: true,
        matchType,
        matchedGuest,
        confidence: "exact",
      };
    }

    return { hasMatch: false, confidence: "none" };
  }

  async getGuestVisits(guestId: string): Promise<GuestVisit[]> {
    const { data } = await supabase
      .from("guest_visits")
      .select("*")
      .eq("guest_id", guestId)
      .order("visit_date", { ascending: false });

    return (data || []).map((row: any) => ({
      id: row.id,
      organization_id: row.organization_id || "dev-org-001",
      outlet_id: row.outlet_id,
      outlet_name: row.outlet_name || "Quantum Climb",
      guest_id: row.guest_id,
      reservation_id: row.reservation_id || null,
      order_id: row.order_id || null,
      visit_date: row.visit_date,
      arrival_at: row.arrival_at || null,
      seated_at: row.seated_at || null,
      completed_at: row.completed_at || null,
      party_size: row.party_size || null,
      seating_area_id: row.seating_area_id || null,
      seating_area_name: row.seating_area_name || null,
      table_id: row.table_id || null,
      table_number: row.table_number || null,
      occasion: row.occasion || null,
      service_notes: row.service_notes || null,
      created_at: row.created_at,
      updated_at: row.updated_at || row.created_at,
    }));
  }

  async getUpcomingReservations(guestId: string): Promise<GuestUpcomingReservationPreview[]> {
    const { data } = await supabase
      .from("reservations")
      .select("*")
      .eq("guest_id", guestId)
      .gte("reservation_date", new Date().toISOString().split("T")[0])
      .order("reservation_date", { ascending: true });

    return (data || []).map((row: any) => ({
      id: row.id,
      reservation_date: row.reservation_date || "",
      reservation_time: row.reservation_time || "",
      party_size: row.party_size,
      outlet_name: "Quantum Climb",
      seating_area_name: row.seating_area_name || undefined,
      status: row.status,
    }));
  }

  async getRecentOrders(guestId: string): Promise<GuestRecentOrderPreview[]> {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("guest_id", guestId)
      .order("opened_at", { ascending: false })
      .limit(5);

    return (data || []).map((row: any) => ({
      id: row.id,
      order_number: row.order_number || `ORD-${row.id.slice(0, 6)}`,
      opened_at: row.opened_at || "",
      table_number: row.table_number || "—",
      dishes: (row.order_items || []).map((i: any) => i.item_name || "Item").slice(0, 5),
    }));
  }

  async addTag(guestId: string, tag: string): Promise<Guest> {
    const current = await this.getGuest(guestId);
    if (!current) throw new Error("Guest not found");
    const updatedTags = Array.from(new Set([...current.tags, tag.trim()]));
    return this.updateGuest(guestId, { tags: updatedTags });
  }

  async removeTag(guestId: string, tag: string): Promise<Guest> {
    const current = await this.getGuest(guestId);
    if (!current) throw new Error("Guest not found");
    const updatedTags = current.tags.filter((t) => t !== tag);
    return this.updateGuest(guestId, { tags: updatedTags });
  }

  async addHospitalityNote(guestId: string, note: string): Promise<Guest> {
    const current = await this.getGuest(guestId);
    if (!current) throw new Error("Guest not found");
    const combinedNotes = current.hospitality_notes ? `${current.hospitality_notes}\n${note}` : note;
    return this.updateGuest(guestId, { hospitality_notes: combinedNotes });
  }

  async getGuestSummary(orgId = "dev-org-001"): Promise<GuestSummaryMetrics> {
    const guests = await this.listGuests(orgId);

    let vipGuestsCount = 0;
    let returningGuestsCount = 0;
    let allergyAlertsCount = 0;

    guests.forEach((g) => {
      if (g.is_vip) vipGuestsCount++;
      if (g.visit_count >= 2) returningGuestsCount++;
      if (g.allergies.length > 0) allergyAlertsCount++;
    });

    return {
      totalGuestsCount: guests.length,
      returningGuestsCount,
      vipGuestsCount,
      upcomingOccasionsCount: 0, // Would require cross-referencing dates
      allergyAlertsCount,
    };
  }

  private mapToDomain(row: any): Guest {
    return {
      id: row.id,
      organization_id: row.organization_id,
      first_name: row.first_name,
      last_name: row.last_name,
      display_name: row.display_name || null,
      phone: row.phone || null,
      phone_normalized: row.phone_normalized || null,
      whatsapp: row.whatsapp || null,
      whatsapp_normalized: row.whatsapp_normalized || null,
      email: row.email || null,
      email_normalized: row.email_normalized || null,
      date_of_birth: row.date_of_birth || null,
      anniversary_date: row.anniversary_date || null,
      preferred_language: row.preferred_language || "en",
      preferred_outlet_id: row.preferred_outlet_id || null,
      preferred_outlet_name: row.preferred_outlet_name || null,
      preferred_seating_area_id: row.preferred_seating_area_id || null,
      preferred_seating_area_name: row.preferred_seating_area_name || null,
      preferred_table_id: row.preferred_table_id || null,
      preferred_table_number: row.preferred_table_number || null,
      dietary_requirements: row.dietary_requirements || [],
      allergies: row.allergies || [],
      hospitality_notes: row.hospitality_notes || null,
      tags: row.tags || [],
      visit_count: row.visit_count || 0,
      first_visit_at: row.first_visit_at || null,
      last_visit_at: row.last_visit_at || null,
      last_reservation_at: row.last_reservation_at || null,
      is_vip: row.is_vip ?? false,
      is_active: row.is_active ?? true,
      marketing_email_opt_in: row.marketing_email_opt_in ?? false,
      marketing_whatsapp_opt_in: row.marketing_whatsapp_opt_in ?? false,
      marketing_sms_opt_in: row.marketing_sms_opt_in ?? false,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
