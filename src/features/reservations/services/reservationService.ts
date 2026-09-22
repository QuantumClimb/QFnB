import { 
  Reservation, 
  ReservationStatus, 
  CreateReservationInput, 
  UpdateReservationInput, 
  ReservationFilterCriteria, 
  SeatingArea,
  ReservationStatusHistoryItem
} from "../types";
import { initialReservationsFixture, defaultSeatingAreas } from "../fixtures/reservationFixtures";

export interface IReservationService {
  listReservations(criteria?: Partial<ReservationFilterCriteria>, outletId?: string): Promise<Reservation[]>;
  getReservation(id: string): Promise<Reservation | null>;
  createReservation(input: CreateReservationInput, outletId?: string, orgId?: string): Promise<Reservation>;
  updateReservation(id: string, input: UpdateReservationInput): Promise<Reservation>;
  changeStatus(id: string, newStatus: ReservationStatus, note?: string, changedBy?: string): Promise<Reservation>;
  cancelReservation(id: string, reason?: string, changedBy?: string): Promise<Reservation>;
  getSeatingAreas(outletId?: string): Promise<SeatingArea[]>;
}

class FixtureReservationService implements IReservationService {
  private reservations: Reservation[];
  private seatingAreas: SeatingArea[];

  constructor() {
    this.reservations = JSON.parse(JSON.stringify(initialReservationsFixture));
    this.seatingAreas = JSON.parse(JSON.stringify(defaultSeatingAreas));
  }

  async listReservations(criteria?: Partial<ReservationFilterCriteria>, _outletId?: string): Promise<Reservation[]> {
    await new Promise((res) => setTimeout(res, 60)); // Simulate micro network delay
    
    let result = [...this.reservations];

    if (!criteria) {
      return result;
    }

    // Filter by view mode: today, upcoming, all
    const todayStr = "2026-09-19";
    if (criteria.viewMode === "today") {
      result = result.filter((r) => r.reservation_date === todayStr);
    } else if (criteria.viewMode === "upcoming") {
      result = result.filter((r) => r.reservation_date >= todayStr && r.status !== "completed" && r.status !== "cancelled" && r.status !== "no_show");
    }

    // Specific date filter
    if (criteria.date) {
      result = result.filter((r) => r.reservation_date === criteria.date);
    }

    // Status filter
    if (criteria.status && criteria.status !== "all") {
      result = result.filter((r) => r.status === criteria.status);
    }

    // Seating Area filter
    if (criteria.seatingAreaId && criteria.seatingAreaId !== "all") {
      result = result.filter((r) => r.seating_area_id === criteria.seatingAreaId);
    }

    // Booking source filter
    if (criteria.bookingSource && criteria.bookingSource !== "all") {
      result = result.filter((r) => r.booking_source === criteria.bookingSource);
    }

    // Party size filter
    if (criteria.minPartySize && criteria.minPartySize > 0) {
      result = result.filter((r) => r.party_size >= (criteria.minPartySize || 0));
    }

    // Search query across Guest Name, Phone, Email, Reference, Token
    if (criteria.searchQuery && criteria.searchQuery.trim() !== "") {
      const q = criteria.searchQuery.toLowerCase().trim();
      result = result.filter((r) => 
        r.guest_name.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.whatsapp && r.whatsapp.toLowerCase().includes(q)) ||
        (r.external_reference && r.external_reference.toLowerCase().includes(q)) ||
        (r.assigned_table_label && r.assigned_table_label.toLowerCase().includes(q)) ||
        r.reservation_token.toLowerCase().includes(q)
      );
    }

    // Sort by reservation date and time ascending
    return result.sort((a, b) => {
      const dateCmp = a.reservation_date.localeCompare(b.reservation_date);
      if (dateCmp !== 0) return dateCmp;
      return a.reservation_time.localeCompare(b.reservation_time);
    });
  }

  async getReservation(id: string): Promise<Reservation | null> {
    await new Promise((res) => setTimeout(res, 50));
    const found = this.reservations.find((r) => r.id === id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  async createReservation(input: CreateReservationInput, outletId = "out-1", orgId = "org-1"): Promise<Reservation> {
    await new Promise((res) => setTimeout(res, 100));

    // Area name resolution
    const area = this.seatingAreas.find((a) => a.id === input.seating_area_id);

    const newRes: Reservation = {
      id: `res-${Date.now()}`,
      organization_id: orgId,
      outlet_id: outletId,
      guest_name: input.guest_name,
      phone: input.phone,
      email: input.email || null,
      whatsapp: input.whatsapp || input.phone,
      reservation_date: input.reservation_date,
      reservation_time: input.reservation_time,
      party_size: Number(input.party_size),
      seating_area_id: input.seating_area_id || "area-main",
      seating_area_name: area?.name || "Main Dining Room",
      assigned_table_id: null,
      assigned_table_label: input.assigned_table_label || null,
      booking_source: input.booking_source || "staff",
      status: "confirmed",
      special_occasion: input.special_occasion || null,
      special_requests: input.special_requests || null,
      dietary_requirements: input.dietary_requirements || null,
      allergies: input.allergies || null,
      expected_duration_minutes: input.expected_duration_minutes || 90,
      deposit_status: input.deposit_status || "not_required",
      deposit_amount: input.deposit_amount || 0,
      external_reference: `STAFF-${Date.now().toString().slice(-4)}`,
      external_request_id: `idemp-${Date.now()}`,
      reservation_token: `tok_${Math.random().toString(36).substring(2, 10)}`,
      created_by: "Host Stand / Staff",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status_history: [
        {
          id: `hist-${Date.now()}`,
          reservation_id: `res-${Date.now()}`,
          old_status: null,
          new_status: "confirmed",
          changed_by: "Host Stand / Staff",
          changed_at: new Date().toISOString(),
          note: "Direct reservation created by staff",
        },
      ],
    };

    this.reservations.unshift(newRes);
    return JSON.parse(JSON.stringify(newRes));
  }

  async updateReservation(id: string, input: UpdateReservationInput): Promise<Reservation> {
    await new Promise((res) => setTimeout(res, 80));
    const target = this.reservations.find((r) => r.id === id);
    if (!target) {
      throw new Error(`Reservation ${id} not found`);
    }

    const previousStatus = target.status;

    if (input.guest_name !== undefined) target.guest_name = input.guest_name;
    if (input.phone !== undefined) target.phone = input.phone;
    if (input.email !== undefined) target.email = input.email;
    if (input.whatsapp !== undefined) target.whatsapp = input.whatsapp;
    if (input.reservation_date !== undefined) target.reservation_date = input.reservation_date;
    if (input.reservation_time !== undefined) target.reservation_time = input.reservation_time;
    if (input.party_size !== undefined) target.party_size = input.party_size;
    if (input.seating_area_id !== undefined) {
      target.seating_area_id = input.seating_area_id;
      const area = this.seatingAreas.find((a) => a.id === input.seating_area_id);
      target.seating_area_name = area?.name || target.seating_area_name;
    }
    if (input.assigned_table_label !== undefined) target.assigned_table_label = input.assigned_table_label;
    if (input.special_occasion !== undefined) target.special_occasion = input.special_occasion;
    if (input.special_requests !== undefined) target.special_requests = input.special_requests;
    if (input.dietary_requirements !== undefined) target.dietary_requirements = input.dietary_requirements;
    if (input.allergies !== undefined) target.allergies = input.allergies;
    if (input.deposit_status !== undefined) target.deposit_status = input.deposit_status;
    if (input.deposit_amount !== undefined) target.deposit_amount = input.deposit_amount;

    if (input.status !== undefined && input.status !== previousStatus) {
      target.status = input.status;
      if (!target.status_history) target.status_history = [];
      target.status_history.push({
        id: `hist-${Date.now()}`,
        reservation_id: target.id,
        old_status: previousStatus,
        new_status: input.status,
        changed_by: "Staff Lead",
        changed_at: new Date().toISOString(),
        note: input.note || "Status updated via reservation workspace",
      });
    }

    target.updated_at = new Date().toISOString();
    return JSON.parse(JSON.stringify(target));
  }

  async changeStatus(id: string, newStatus: ReservationStatus, note?: string, changedBy = "Staff Lead"): Promise<Reservation> {
    await new Promise((res) => setTimeout(res, 80));
    const target = this.reservations.find((r) => r.id === id);
    if (!target) {
      throw new Error(`Reservation ${id} not found`);
    }

    const previousStatus = target.status;
    target.status = newStatus;
    target.updated_at = new Date().toISOString();

    if (!target.status_history) target.status_history = [];
    const historyItem: ReservationStatusHistoryItem = {
      id: `hist-${Date.now()}`,
      reservation_id: target.id,
      old_status: previousStatus,
      new_status: newStatus,
      changed_by: changedBy,
      changed_at: new Date().toISOString(),
      note: note || `Status transitioned to ${newStatus.toUpperCase()}`,
    };
    target.status_history.push(historyItem);

    return JSON.parse(JSON.stringify(target));
  }

  async cancelReservation(id: string, reason?: string, changedBy = "Staff Lead"): Promise<Reservation> {
    return this.changeStatus(id, "cancelled", reason || "Cancelled by guest/staff", changedBy);
  }

  async getSeatingAreas(_outletId?: string): Promise<SeatingArea[]> {
    await new Promise((res) => setTimeout(res, 30));
    return JSON.parse(JSON.stringify(this.seatingAreas));
  }
}

export const reservationService: IReservationService = new FixtureReservationService();
