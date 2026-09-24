import { supabase } from "../../../lib/supabase";
import type { IReservationService } from "./IReservationService";
import type {
  Reservation,
  ReservationFilterCriteria,
  CreateReservationInput,
  UpdateReservationInput,
  ReservationStatus,
  SeatingArea,
} from "../types";

export class SupabaseReservationService implements IReservationService {
  async listReservations(criteria?: Partial<ReservationFilterCriteria>, outletId?: string): Promise<Reservation[]> {
    let query = supabase.from("reservations").select("*");

    if (outletId) {
      query = query.eq("outlet_id", outletId);
    }
    if (criteria?.status && criteria.status !== "all") {
      query = query.eq("status", criteria.status);
    }
    if (criteria?.date) {
      query = query.eq("reservation_date", criteria.date);
    }
    if (criteria?.seatingAreaId && criteria.seatingAreaId !== "all") {
      query = query.eq("seating_area_id", criteria.seatingAreaId);
    }
    if (criteria?.bookingSource && criteria.bookingSource !== "all") {
      query = query.eq("booking_source", criteria.bookingSource);
    }
    if (criteria?.searchQuery) {
      const q = criteria.searchQuery.trim();
      query = query.or(`guest_name.ilike.%${q}%,phone.ilike.%${q}%`);
    }

    const { data, error } = await query.order("reservation_time", { ascending: true });
    if (error) {
      console.error("[SupabaseReservationService] listReservations error:", error);
      return [];
    }

    return (data || []).map(this.mapToDomain);
  }

  async getReservation(id: string): Promise<Reservation | null> {
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async createReservation(input: CreateReservationInput, outletId = "7e76ef38-0b8d-4a17-8ebd-c89b455270a4", orgId = "73b9d863-89e8-4999-87a3-f76e2c716268"): Promise<Reservation> {
    const row: Record<string, any> = {
      organization_id: orgId,
      outlet_id: outletId,
      guest_name: input.guest_name,
      phone: input.phone,
      email: input.email || null,
      whatsapp: input.whatsapp || null,
      party_size: input.party_size,
      reservation_date: input.reservation_date,
      reservation_time: input.reservation_time,
      seating_area_id: input.seating_area_id || null,
      assigned_table_label: input.assigned_table_label || null,
      booking_source: input.booking_source || "staff",
      special_occasion: input.special_occasion || null,
      special_requests: input.special_requests || null,
      dietary_requirements: input.dietary_requirements || null,
      allergies: input.allergies || null,
      expected_duration_minutes: input.expected_duration_minutes || 90,
      deposit_status: input.deposit_status || "not_required",
      deposit_amount: input.deposit_amount || null,
      status: "confirmed",
    };

    const { data, error } = await supabase
      .from("reservations")
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("[SupabaseReservationService] createReservation error:", error);
      throw error;
    }

    return this.mapToDomain(data);
  }

  async updateReservation(id: string, input: UpdateReservationInput): Promise<Reservation> {
    const updates: Record<string, any> = {};
    if (input.party_size !== undefined) updates.party_size = input.party_size;
    if (input.reservation_date !== undefined) updates.reservation_date = input.reservation_date;
    if (input.reservation_time !== undefined) updates.reservation_time = input.reservation_time;
    if (input.seating_area_id !== undefined) updates.seating_area_id = input.seating_area_id;
    if (input.assigned_table_id !== undefined) updates.assigned_table_id = input.assigned_table_id;
    if (input.assigned_table_label !== undefined) updates.assigned_table_label = input.assigned_table_label;
    if (input.special_occasion !== undefined) updates.special_occasion = input.special_occasion;
    if (input.special_requests !== undefined) updates.special_requests = input.special_requests;
    if (input.dietary_requirements !== undefined) updates.dietary_requirements = input.dietary_requirements;
    if (input.allergies !== undefined) updates.allergies = input.allergies;
    if (input.guest_name !== undefined) updates.guest_name = input.guest_name;
    if (input.phone !== undefined) updates.phone = input.phone;
    if (input.email !== undefined) updates.email = input.email;
    if (input.whatsapp !== undefined) updates.whatsapp = input.whatsapp;
    if (input.status !== undefined) updates.status = input.status;
    if (input.expected_duration_minutes !== undefined) updates.expected_duration_minutes = input.expected_duration_minutes;
    if (input.deposit_status !== undefined) updates.deposit_status = input.deposit_status;
    if (input.deposit_amount !== undefined) updates.deposit_amount = input.deposit_amount;

    const { data, error } = await supabase
      .from("reservations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[SupabaseReservationService] updateReservation error:", error);
      throw error;
    }

    return this.mapToDomain(data);
  }

  async changeStatus(id: string, newStatus: ReservationStatus, note?: string, changedBy = "Staff Lead"): Promise<Reservation> {
    const { data, error } = await supabase
      .from("reservations")
      .update({ status: newStatus })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[SupabaseReservationService] changeStatus error:", error);
      throw error;
    }

    // Insert audit log
    await supabase.from("reservation_status_history").insert({
      reservation_id: id,
      new_status: newStatus,
      note: note || `Status changed to ${newStatus}`,
      changed_by: changedBy,
    });

    return this.mapToDomain(data);
  }

  async cancelReservation(id: string, reason?: string, changedBy = "Staff Lead"): Promise<Reservation> {
    return this.changeStatus(id, "cancelled", reason, changedBy);
  }

  async getSeatingAreas(outletId?: string): Promise<SeatingArea[]> {
    let query = supabase.from("seating_areas").select("*");
    if (outletId) query = query.eq("outlet_id", outletId);

    const { data, error } = await query.order("display_order", { ascending: true });
    if (error) {
      console.error("[SupabaseReservationService] getSeatingAreas error:", error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      organization_id: row.organization_id || "dev-org-001",
      outlet_id: row.outlet_id,
      name: row.name,
      description: row.description || undefined,
      capacity: row.capacity || 0,
      is_active: row.is_active ?? true,
      display_order: row.display_order ?? row.sort_order ?? 0,
    }));
  }

  private mapToDomain(row: any): Reservation {
    return {
      id: row.id,
      organization_id: row.organization_id || "dev-org-001",
      outlet_id: row.outlet_id,
      guest_id: row.guest_id || null,
      guest_name: row.guest_name,
      phone: row.phone || row.guest_phone || "",
      email: row.email || row.guest_email || null,
      whatsapp: row.whatsapp || null,
      party_size: row.party_size,
      reservation_date: row.reservation_date || (row.reservation_time ? row.reservation_time.split("T")[0] : ""),
      reservation_time: row.reservation_time || "",
      seating_area_id: row.seating_area_id || null,
      seating_area_name: row.seating_area_name || null,
      assigned_table_id: row.assigned_table_id || null,
      assigned_table_label: row.assigned_table_label || null,
      booking_source: row.booking_source || "staff",
      status: row.status,
      special_occasion: row.special_occasion || null,
      special_requests: row.special_requests || null,
      dietary_requirements: row.dietary_requirements || null,
      allergies: row.allergies || null,
      expected_duration_minutes: row.expected_duration_minutes || 90,
      deposit_status: row.deposit_status || "not_required",
      deposit_amount: row.deposit_amount || null,
      external_reference: row.external_reference || null,
      external_request_id: row.external_request_id || null,
      reservation_token: row.reservation_token || row.id,
      created_by: row.created_by || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      status_history: [],
    };
  }
}
