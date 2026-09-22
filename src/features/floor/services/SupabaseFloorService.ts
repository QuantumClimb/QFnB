import { supabase } from "../../../lib/supabase";
import type { IFloorService } from "./IFloorService";
import type {
  RestaurantTable,
  FloorSeatingArea,
  FloorSummary,
  TableStatus,
  SeatReservationInput,
  SeatWalkInInput,
} from "../types";

export class SupabaseFloorService implements IFloorService {
  async listSeatingAreas(outletId?: string): Promise<FloorSeatingArea[]> {
    let query = supabase.from("seating_areas").select("*");
    if (outletId) query = query.eq("outlet_id", outletId);

    const { data, error } = await query.order("sort_order", { ascending: true });
    if (error) {
      console.error("[SupabaseFloorService] listSeatingAreas error:", error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      capacity: row.capacity || 0,
      tablesCount: 0,
      is_active: row.is_active ?? true,
    }));
  }

  async listTables(outletId?: string, areaId?: string): Promise<RestaurantTable[]> {
    let query = supabase.from("restaurant_tables").select("*");
    if (outletId) query = query.eq("outlet_id", outletId);
    if (areaId) query = query.eq("seating_area_id", areaId);

    const { data, error } = await query.order("table_number", { ascending: true });
    if (error) {
      console.error("[SupabaseFloorService] listTables error:", error);
      return [];
    }

    return (data || []).map(this.mapToDomain);
  }

  async getTable(tableId: string): Promise<RestaurantTable | null> {
    const { data, error } = await supabase
      .from("restaurant_tables")
      .select("*")
      .eq("id", tableId)
      .single();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async changeTableStatus(tableId: string, newStatus: TableStatus, note?: string, changedBy = "Host Stand"): Promise<RestaurantTable> {
    const updates: Record<string, any> = { status: newStatus };
    if (newStatus === "available") {
      // Clear session data when table becomes available
      updates.current_session_data = null;
    }

    const { data, error } = await supabase
      .from("restaurant_tables")
      .update(updates)
      .eq("id", tableId)
      .select()
      .single();

    if (error) {
      console.error("[SupabaseFloorService] changeTableStatus error:", error);
      throw error;
    }

    await supabase.from("table_state_history").insert({
      table_id: tableId,
      previous_status: newStatus,
      new_status: newStatus,
      changed_by: changedBy,
      notes: note || `Status updated to ${newStatus}`,
    });

    return this.mapToDomain(data);
  }

  async seatReservation(tableId: string, reservationId: string, guestData: SeatReservationInput): Promise<RestaurantTable> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("restaurant_tables")
      .update({
        status: "seated",
        current_session_data: JSON.stringify({
          reservationId,
          guestName: guestData.guestName,
          partySize: guestData.partySize,
          seatedAt: now,
          phone: guestData.phone || null,
          specialOccasion: guestData.specialOccasion || null,
          allergies: guestData.allergies || null,
          dietaryNotes: guestData.dietaryNotes || null,
          expectedDurationMinutes: guestData.expectedDurationMinutes || 90,
        }),
      })
      .eq("id", tableId)
      .select()
      .single();

    if (error) {
      console.error("[SupabaseFloorService] seatReservation error:", error);
      throw error;
    }

    // Update reservation status to seated
    await supabase.from("reservations").update({
      status: "seated",
      assigned_table_id: tableId,
    }).eq("id", reservationId);

    return this.mapToDomain(data);
  }

  async seatWalkIn(tableId: string, guestData: SeatWalkInInput): Promise<RestaurantTable> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("restaurant_tables")
      .update({
        status: "seated",
        current_session_data: JSON.stringify({
          reservationId: null,
          guestName: guestData.guestName,
          partySize: guestData.partySize,
          seatedAt: now,
          phone: guestData.phone || null,
          specialOccasion: guestData.specialOccasion || null,
          allergies: guestData.allergies || null,
          dietaryNotes: guestData.dietaryNotes || null,
          expectedDurationMinutes: guestData.expectedDurationMinutes || 75,
        }),
      })
      .eq("id", tableId)
      .select()
      .single();

    if (error) {
      console.error("[SupabaseFloorService] seatWalkIn error:", error);
      throw error;
    }

    return this.mapToDomain(data);
  }

  async moveParty(fromTableId: string, toTableId: string): Promise<{ fromTable: RestaurantTable; toTable: RestaurantTable }> {
    const fromTable = await this.getTable(fromTableId);
    if (!fromTable) throw new Error("Source table not found");

    // Move session to target table
    const sessionData = fromTable.current_session ? JSON.stringify(fromTable.current_session) : null;
    const { data: targetData, error: targetError } = await supabase
      .from("restaurant_tables")
      .update({
        status: "seated",
        current_session_data: sessionData,
      })
      .eq("id", toTableId)
      .select()
      .single();

    if (targetError) throw targetError;

    // Clear origin table to cleaning
    const { data: sourceData, error: sourceError } = await supabase
      .from("restaurant_tables")
      .update({
        status: "cleaning",
        current_session_data: null,
      })
      .eq("id", fromTableId)
      .select()
      .single();

    if (sourceError) throw sourceError;

    return {
      fromTable: this.mapToDomain(sourceData),
      toTable: this.mapToDomain(targetData),
    };
  }

  async markCleaning(tableId: string): Promise<RestaurantTable> {
    return this.changeTableStatus(tableId, "cleaning", "Marked for cleaning");
  }

  async markAvailable(tableId: string): Promise<RestaurantTable> {
    return this.changeTableStatus(tableId, "available", "Marked available for seating");
  }

  async blockTable(tableId: string, reason?: string): Promise<RestaurantTable> {
    return this.changeTableStatus(tableId, "blocked", reason || "Maintenance / Blocked");
  }

  async getFloorSummary(outletId?: string): Promise<FloorSummary> {
    const tables = await this.listTables(outletId);
    const summary: FloorSummary = {
      totalTables: tables.length,
      availableCount: 0,
      reservedCount: 0,
      arrivingCount: 0,
      seatedCount: 0,
      diningCount: 0,
      billRequestedCount: 0,
      cleaningCount: 0,
      blockedCount: 0,
      totalCapacity: 0,
      occupiedCapacity: 0,
      occupancyRatePercent: 0,
    };

    tables.forEach((t) => {
      summary.totalCapacity += t.capacity;
      if (t.status === "available") summary.availableCount++;
      else if (t.status === "reserved") summary.reservedCount++;
      else if (t.status === "arriving") summary.arrivingCount++;
      else if (t.status === "seated") {
        summary.seatedCount++;
        summary.occupiedCapacity += t.current_session?.partySize || t.capacity;
      } else if (t.status === "dining") {
        summary.diningCount++;
        summary.occupiedCapacity += t.current_session?.partySize || t.capacity;
      } else if (t.status === "ordering") {
        summary.occupiedCapacity += t.current_session?.partySize || t.capacity;
      } else if (t.status === "bill_requested") {
        summary.billRequestedCount++;
        summary.occupiedCapacity += t.current_session?.partySize || t.capacity;
      } else if (t.status === "cleaning") summary.cleaningCount++;
      else if (t.status === "blocked") summary.blockedCount++;
    });

    if (summary.totalCapacity > 0) {
      summary.occupancyRatePercent = Math.round((summary.occupiedCapacity / summary.totalCapacity) * 100);
    }

    return summary;
  }

  private mapToDomain(row: any): RestaurantTable {
    // Parse session data if stored as JSON string
    let currentSession = null;
    if (row.current_session_data) {
      try {
        const sd = typeof row.current_session_data === "string"
          ? JSON.parse(row.current_session_data)
          : row.current_session_data;
        const seatedAt = sd.seatedAt || row.seated_at || new Date().toISOString();
        const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(seatedAt).getTime()) / 60000));
        currentSession = {
          reservationId: sd.reservationId || null,
          guestName: sd.guestName || "Guest",
          phone: sd.phone || null,
          partySize: sd.partySize || row.capacity || 2,
          seatedAt,
          elapsedMinutes,
          expectedDurationMinutes: sd.expectedDurationMinutes || 90,
          specialOccasion: sd.specialOccasion || null,
          allergies: sd.allergies || null,
          dietaryNotes: sd.dietaryNotes || null,
          serverName: sd.serverName || null,
          orderSummaryPlaceholder: sd.orderSummaryPlaceholder || null,
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
      seating_area_name: row.seating_area_name || undefined,
      table_number: row.table_number,
      display_name: row.display_name || null,
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
