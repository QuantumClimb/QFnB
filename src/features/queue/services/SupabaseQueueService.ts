import { supabase } from "../../../lib/supabase";
import type { IQueueService } from "./IQueueService";
import type {
  WaitlistEntry,
  WaitlistStatus,
  AddWaitlistEntryInput,
  UpdateWaitlistEntryInput,
  SeatFromQueueInput,
  QueueSummary,
  WaitEstimationResult,
} from "../types";
import type { RestaurantTable } from "../../floor/types";
import { DeterministicWaitEstimationService } from "./waitEstimationService";

const waitEstimation = new DeterministicWaitEstimationService();

export class SupabaseQueueService implements IQueueService {
  async listEntries(outletId?: string, statusFilter?: string): Promise<WaitlistEntry[]> {
    let query = supabase.from("waitlist_entries").select("*");
    if (outletId) query = query.eq("outlet_id", outletId);

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    } else {
      query = query.in("status", ["waiting", "notified", "arrived", "table_preparing", "ready"]);
    }

    const { data, error } = await query.order("joined_at", { ascending: true });
    if (error) {
      console.error("[SupabaseQueueService] listEntries error:", error);
      return [];
    }

    return (data || []).map((row: any, idx: number) => this.mapToDomain(row, idx + 1));
  }

  async getEntry(entryId: string): Promise<WaitlistEntry | null> {
    const { data, error } = await supabase
      .from("waitlist_entries")
      .select("*")
      .eq("id", entryId)
      .single();

    if (error || !data) return null;
    return this.mapToDomain(data, 1);
  }

  async addEntry(input: AddWaitlistEntryInput, outletId = "dev-outlet-001"): Promise<WaitlistEntry> {
    const row: Record<string, any> = {
      outlet_id: outletId,
      guest_name: input.guest_name,
      party_size: input.party_size,
      phone: input.phone,
      whatsapp: input.whatsapp || input.phone,
      email: input.email || null,
      preferred_seating_area_id: input.preferred_seating_area_id || null,
      quoted_wait_minutes: input.quoted_wait_minutes,
      estimated_wait_minutes: input.quoted_wait_minutes,
      notes: input.notes || null,
      special_occasion: input.special_occasion || null,
      dietary_requirements: input.dietary_requirements || [],
      allergies: input.allergies || [],
      priority_tags: input.priority_tags || [],
      source: input.source || "staff",
      status: "waiting",
      joined_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("waitlist_entries")
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("[SupabaseQueueService] addEntry error:", error);
      throw error;
    }

    return this.mapToDomain(data, 1);
  }

  async updateEntry(entryId: string, input: UpdateWaitlistEntryInput): Promise<WaitlistEntry> {
    const updates: Record<string, any> = {};
    if (input.party_size !== undefined) updates.party_size = input.party_size;
    if (input.phone !== undefined) updates.phone = input.phone;
    if (input.guest_name !== undefined) updates.guest_name = input.guest_name;
    if (input.notes !== undefined) updates.notes = input.notes;
    if (input.special_occasion !== undefined) updates.special_occasion = input.special_occasion;
    if (input.preferred_seating_area_id !== undefined) updates.preferred_seating_area_id = input.preferred_seating_area_id;
    if (input.quoted_wait_minutes !== undefined) updates.quoted_wait_minutes = input.quoted_wait_minutes;
    if (input.dietary_requirements !== undefined) updates.dietary_requirements = input.dietary_requirements;
    if (input.allergies !== undefined) updates.allergies = input.allergies;
    if (input.priority_tags !== undefined) updates.priority_tags = input.priority_tags;

    const { data, error } = await supabase
      .from("waitlist_entries")
      .update(updates)
      .eq("id", entryId)
      .select()
      .single();

    if (error) {
      console.error("[SupabaseQueueService] updateEntry error:", error);
      throw error;
    }

    return this.mapToDomain(data, 1);
  }

  async changeStatus(entryId: string, status: WaitlistStatus, note?: string, changedBy = "Queue Host"): Promise<WaitlistEntry> {
    const updates: Record<string, any> = { status };
    if (status === "notified") updates.notified_at = new Date().toISOString();
    if (status === "arrived") updates.arrived_at = new Date().toISOString();
    if (status === "seated") updates.seated_at = new Date().toISOString();
    if (status === "cancelled") updates.cancelled_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("waitlist_entries")
      .update(updates)
      .eq("id", entryId)
      .select()
      .single();

    if (error) {
      console.error("[SupabaseQueueService] changeStatus error:", error);
      throw error;
    }

    await supabase.from("waitlist_status_history").insert({
      waitlist_entry_id: entryId,
      new_status: status,
      note: note || `Queue status updated to ${status}`,
      changed_by: changedBy,
    });

    return this.mapToDomain(data, 1);
  }

  async updateQuotedWait(entryId: string, newQuotedMinutes: number): Promise<WaitlistEntry> {
    const { data, error } = await supabase
      .from("waitlist_entries")
      .update({ quoted_wait_minutes: newQuotedMinutes })
      .eq("id", entryId)
      .select()
      .single();

    if (error) throw error;
    return this.mapToDomain(data, 1);
  }

  async prepareTable(entryId: string, tableId: string): Promise<WaitlistEntry> {
    const { data, error } = await supabase
      .from("waitlist_entries")
      .update({ status: "table_preparing", assigned_table_id: tableId })
      .eq("id", entryId)
      .select()
      .single();

    if (error) throw error;
    return this.mapToDomain(data, 1);
  }

  async markTableReady(entryId: string, tableId?: string): Promise<WaitlistEntry> {
    const updates: Record<string, any> = { status: "ready" };
    if (tableId) updates.assigned_table_id = tableId;

    const { data, error } = await supabase
      .from("waitlist_entries")
      .update(updates)
      .eq("id", entryId)
      .select()
      .single();

    if (error) throw error;
    return this.mapToDomain(data, 1);
  }

  async seatGuest(input: SeatFromQueueInput): Promise<{ entry: WaitlistEntry; table: RestaurantTable }> {
    // Mark entry as seated
    const { data: entryData, error: entryError } = await supabase
      .from("waitlist_entries")
      .update({
        status: "seated",
        assigned_table_id: input.tableId,
        seated_at: new Date().toISOString(),
      })
      .eq("id", input.entryId)
      .select()
      .single();

    if (entryError) throw entryError;

    // Update table status to seated with session data
    const { data: tableData, error: tableError } = await supabase
      .from("restaurant_tables")
      .update({
        status: "seated",
        current_session_data: JSON.stringify({
          guestName: entryData.guest_name,
          partySize: entryData.party_size,
          phone: entryData.phone,
          seatedAt: new Date().toISOString(),
          expectedDurationMinutes: 75,
        }),
      })
      .eq("id", input.tableId)
      .select()
      .single();

    if (tableError) throw tableError;

    const domainTable: RestaurantTable = this.mapTableToDomain(tableData);

    return {
      entry: this.mapToDomain(entryData, 1),
      table: domainTable,
    };
  }

  async cancelEntry(entryId: string, reason?: string): Promise<WaitlistEntry> {
    return this.changeStatus(entryId, "cancelled", reason);
  }

  async markNoResponse(entryId: string, note?: string): Promise<WaitlistEntry> {
    return this.changeStatus(entryId, "no_response", note);
  }

  async getQueueSummary(outletId?: string): Promise<QueueSummary> {
    const entries = await this.listEntries(outletId);
    let waitingCount = 0;
    let totalGuestsWaiting = 0;
    let totalWaitMins = 0;
    let longestWaitMins = 0;
    let tablesPreparingCount = 0;
    let notifiedCount = 0;
    let readyCount = 0;

    entries.forEach((e) => {
      const elapsed = Math.max(0, Math.floor((Date.now() - new Date(e.joined_at).getTime()) / 60000));
      if (e.status === "waiting" || e.status === "notified" || e.status === "table_preparing") {
        waitingCount++;
        totalGuestsWaiting += e.party_size;
        totalWaitMins += elapsed;
        if (elapsed > longestWaitMins) longestWaitMins = elapsed;
      }
      if (e.status === "table_preparing") tablesPreparingCount++;
      if (e.status === "notified") notifiedCount++;
      if (e.status === "ready") readyCount++;
    });

    const averageWaitMinutes = waitingCount > 0 ? Math.round(totalWaitMins / waitingCount) : 0;
    let queuePressure: "NORMAL" | "BUSY" | "HIGH_WAIT" = "NORMAL";
    if (averageWaitMinutes > 30) queuePressure = "HIGH_WAIT";
    else if (averageWaitMinutes > 15 || waitingCount > 5) queuePressure = "BUSY";

    return {
      waitingParties: waitingCount,
      totalGuestsWaiting,
      averageWaitMinutes,
      longestWaitMinutes: longestWaitMins,
      tablesPreparingCount,
      guestsNotifiedCount: notifiedCount,
      readyCount,
      queuePressure,
    };
  }

  async getRecommendedTables(partySize: number, preferredAreaId?: string): Promise<RestaurantTable[]> {
    let query = supabase
      .from("restaurant_tables")
      .select("*")
      .eq("status", "available")
      .gte("capacity", partySize);

    if (preferredAreaId) query = query.eq("seating_area_id", preferredAreaId);

    const { data } = await query.order("capacity", { ascending: true });
    return (data || []).map(this.mapTableToDomain);
  }

  async estimateWait(partySize: number, preferredAreaId?: string): Promise<WaitEstimationResult> {
    const entries = await this.listEntries();
    return waitEstimation.estimateWait(partySize, preferredAreaId, entries, []);
  }

  private mapToDomain(row: any, _queuePosition = 1): WaitlistEntry {
    return {
      id: row.id,
      organization_id: row.organization_id || "dev-org-001",
      outlet_id: row.outlet_id,
      guest_id: row.guest_id || null,
      guest_name: row.guest_name,
      phone: row.phone || "",
      whatsapp: row.whatsapp || null,
      email: row.email || null,
      party_size: row.party_size,
      preferred_seating_area_id: row.preferred_seating_area_id || row.seating_area_id || null,
      preferred_seating_area_name: row.preferred_seating_area_name || null,
      quoted_wait_minutes: row.quoted_wait_minutes || row.quoted_wait_time || 20,
      estimated_wait_minutes: row.estimated_wait_minutes || row.quoted_wait_minutes || 20,
      status: row.status,
      queue_number: row.queue_number || `#${String(_queuePosition).padStart(2, "0")}`,
      notes: row.notes || row.guest_notes || null,
      special_occasion: row.special_occasion || null,
      dietary_requirements: row.dietary_requirements || null,
      allergies: row.allergies || null,
      priority_tags: row.priority_tags || null,
      source: row.source || "staff",
      joined_at: row.joined_at,
      notified_at: row.notified_at || null,
      arrived_at: row.arrived_at || null,
      seated_at: row.seated_at || null,
      cancelled_at: row.cancelled_at || null,
      assigned_table_id: row.assigned_table_id || null,
      assigned_table_number: row.assigned_table_number || null,
      reservation_id: row.reservation_id || null,
      guest_status_token: row.guest_status_token || row.id,
      created_by: row.created_by || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private mapTableToDomain(row: any): RestaurantTable {
    let currentSession = null;
    if (row.current_session_data) {
      try {
        const sd = typeof row.current_session_data === "string"
          ? JSON.parse(row.current_session_data)
          : row.current_session_data;
        const seatedAt = sd.seatedAt || new Date().toISOString();
        currentSession = {
          guestName: sd.guestName || "Guest",
          phone: sd.phone || null,
          partySize: sd.partySize || row.capacity || 2,
          seatedAt,
          elapsedMinutes: Math.max(0, Math.floor((Date.now() - new Date(seatedAt).getTime()) / 60000)),
          expectedDurationMinutes: sd.expectedDurationMinutes || 75,
        };
      } catch {
        currentSession = null;
      }
    }

    return {
      id: row.id,
      organization_id: row.organization_id || "dev-org-001",
      outlet_id: row.outlet_id,
      seating_area_id: row.seating_area_id,
      table_number: row.table_number,
      capacity: row.capacity || 2,
      minimum_party_size: row.min_capacity || row.minimum_party_size || 1,
      maximum_party_size: row.max_capacity || row.maximum_party_size || row.capacity || 6,
      shape: row.shape || "rectangle",
      position_x: row.pos_x ?? row.position_x ?? 0,
      position_y: row.pos_y ?? row.position_y ?? 0,
      width: row.width || 80,
      height: row.height || 80,
      rotation: row.rotation || 0,
      status: row.status,
      is_active: row.is_active ?? true,
      is_combinable: row.is_combinable ?? false,
      current_session: currentSession,
      next_reservation: null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
