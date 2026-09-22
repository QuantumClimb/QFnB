import { supabase } from "../../../lib/supabase";
import type { IOrderService } from "./IOrderService";
import type {
  Order,
  OrderItem,
  OpenOrderInput,
  AddOrderItemInput,
  UpdateOrderItemInput,
  OrderSummaryMetrics,
  OrderItemStatus,
} from "../types";

export class SupabaseOrderService implements IOrderService {
  async listOrders(outletId?: string, statusFilter?: string): Promise<Order[]> {
    let query = supabase.from("orders").select("*, order_items(*)");
    if (outletId) query = query.eq("outlet_id", outletId);
    if (statusFilter && statusFilter !== "all") query = query.eq("status", statusFilter);

    const { data, error } = await query.order("opened_at", { ascending: false });
    if (error) {
      console.error("[SupabaseOrderService] listOrders error:", error);
      return [];
    }

    return (data || []).map(this.mapToDomain);
  }

  async getOrder(orderId: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async getActiveOrderForTable(tableId: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("table_id", tableId)
      .neq("status", "completed")
      .neq("status", "cancelled")
      .order("opened_at", { ascending: false })
      .maybeSingle();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async openOrder(input: OpenOrderInput, outletId = "dev-outlet-001"): Promise<Order> {
    const row: Record<string, any> = {
      outlet_id: outletId,
      table_id: input.table_id,
      guest_name: input.guest_name || null,
      reservation_id: input.reservation_id || null,
      waitlist_entry_id: input.waitlist_entry_id || null,
      assigned_staff_id: input.assigned_staff_id || null,
      notes: input.notes || null,
      status: "open",
      opened_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("orders")
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("[SupabaseOrderService] openOrder error:", error);
      throw error;
    }

    return {
      ...this.mapToDomain(data),
      items: [],
    };
  }

  async addItem(orderId: string, input: AddOrderItemInput): Promise<OrderItem> {
    const row: Record<string, any> = {
      order_id: orderId,
      item_name: input.item_name,
      menu_item_id: input.menu_item_id || null,
      unit_price: input.unit_price,
      quantity: input.quantity,
      course: input.course || "main",
      destination_station: input.destination_station || "kitchen",
      seat_number: input.seat_number || null,
      modifiers: input.modifiers || null,
      cooking_preference: input.cooking_preference || null,
      allergy_notes: input.allergy_notes || null,
      special_instructions: input.special_instructions || null,
      status: "pending",
    };

    const { data, error } = await supabase
      .from("order_items")
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("[SupabaseOrderService] addItem error:", error);
      throw error;
    }

    return this.mapItemToDomain(data);
  }

  async updateItem(orderId: string, itemId: string, input: UpdateOrderItemInput): Promise<OrderItem> {
    const updates: Record<string, any> = {};
    if (input.quantity !== undefined) updates.quantity = input.quantity;
    if (input.seat_number !== undefined) updates.seat_number = input.seat_number;
    if (input.course !== undefined) updates.course = input.course;
    if (input.destination_station !== undefined) updates.destination_station = input.destination_station;
    if (input.modifiers !== undefined) updates.modifiers = input.modifiers;
    if (input.cooking_preference !== undefined) updates.cooking_preference = input.cooking_preference;
    if (input.allergy_notes !== undefined) updates.allergy_notes = input.allergy_notes;
    if (input.special_instructions !== undefined) updates.special_instructions = input.special_instructions;

    const { data, error } = await supabase
      .from("order_items")
      .update(updates)
      .eq("id", itemId)
      .eq("order_id", orderId)
      .select()
      .single();

    if (error) throw error;
    return this.mapItemToDomain(data);
  }

  async removeDraftItem(orderId: string, itemId: string): Promise<void> {
    const { error } = await supabase
      .from("order_items")
      .delete()
      .eq("id", itemId)
      .eq("order_id", orderId)
      .eq("status", "pending");

    if (error) throw error;
  }

  async sendOrder(orderId: string): Promise<Order> {
    const now = new Date().toISOString();
    await supabase
      .from("order_items")
      .update({ status: "sent", sent_at: now })
      .eq("order_id", orderId)
      .eq("status", "pending");

    const { data, error } = await supabase
      .from("orders")
      .update({ status: "in_progress", sent_at: now })
      .eq("id", orderId)
      .select("*, order_items(*)")
      .single();

    if (error) throw error;
    return this.mapToDomain(data);
  }

  async updateItemStatus(itemId: string, status: OrderItemStatus): Promise<OrderItem> {
    const updates: Record<string, any> = { status };
    if (status === "preparing") updates.started_at = new Date().toISOString();
    if (status === "ready") updates.ready_at = new Date().toISOString();
    if (status === "served") updates.served_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("order_items")
      .update(updates)
      .eq("id", itemId)
      .select()
      .single();

    if (error) throw error;
    return this.mapItemToDomain(data);
  }

  async acceptItem(_orderId: string, itemId: string): Promise<OrderItem> {
    return this.updateItemStatus(itemId, "accepted");
  }

  async startPreparing(_orderId: string, itemId: string): Promise<OrderItem> {
    return this.updateItemStatus(itemId, "preparing");
  }

  async markItemReady(_orderId: string, itemId: string): Promise<OrderItem> {
    return this.updateItemStatus(itemId, "ready");
  }

  async markItemServed(_orderId: string, itemId: string): Promise<OrderItem> {
    return this.updateItemStatus(itemId, "served");
  }

  async cancelItem(_orderId: string, itemId: string, _reason?: string): Promise<OrderItem> {
    return this.updateItemStatus(itemId, "cancelled");
  }

  async completeOrder(orderId: string): Promise<Order> {
    const { data, error } = await supabase
      .from("orders")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", orderId)
      .select("*, order_items(*)")
      .single();

    if (error) throw error;
    return this.mapToDomain(data);
  }

  async cancelOrder(orderId: string, _reason?: string): Promise<Order> {
    const { data, error } = await supabase
      .from("orders")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", orderId)
      .select("*, order_items(*)")
      .single();

    if (error) throw error;
    return this.mapToDomain(data);
  }

  async getOrderSummary(outletId?: string): Promise<OrderSummaryMetrics> {
    const orders = await this.listOrders(outletId);
    let activeOrdersCount = 0;
    let itemsPreparingCount = 0;
    let itemsReadyCount = 0;
    let tablesWaitingCount = 0;
    let ordersCompletedToday = 0;

    orders.forEach((o) => {
      if (o.status !== "completed" && o.status !== "cancelled") {
        activeOrdersCount++;
        if (o.table_id) tablesWaitingCount++;
      }
      if (o.status === "completed") {
        ordersCompletedToday++;
      }
      o.items.forEach((i) => {
        if (i.status === "preparing") itemsPreparingCount++;
        else if (i.status === "ready") itemsReadyCount++;
      });
    });

    return {
      activeOrdersCount,
      itemsPreparingCount,
      itemsReadyCount,
      averagePrepTimeMinutes: 14,
      tablesWaitingCount,
      ordersCompletedToday,
    };
  }

  private mapToDomain(row: any): Order {
    const rawItems = row.order_items || [];
    const items: OrderItem[] = rawItems.map(this.mapItemToDomain);

    return {
      id: row.id,
      organization_id: row.organization_id || "dev-org-001",
      outlet_id: row.outlet_id,
      table_id: row.table_id || null,
      table_number: row.table_number || null,
      reservation_id: row.reservation_id || null,
      waitlist_entry_id: row.waitlist_entry_id || null,
      guest_name: row.guest_name || null,
      order_number: row.order_number || `ORD-${row.id?.slice(0, 4) || "000"}`,
      status: row.status,
      opened_by: row.opened_by || null,
      assigned_staff_id: row.assigned_staff_id || null,
      assigned_staff_name: row.assigned_staff_name || row.server_name || null,
      opened_at: row.opened_at,
      sent_at: row.sent_at || null,
      completed_at: row.completed_at || row.closed_at || null,
      cancelled_at: row.cancelled_at || null,
      notes: row.notes || null,
      items,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private mapItemToDomain(row: any): OrderItem {
    return {
      id: row.id,
      organization_id: row.organization_id || "dev-org-001",
      outlet_id: row.outlet_id || "dev-outlet-001",
      order_id: row.order_id,
      item_name: row.item_name || row.name || "Item",
      menu_item_id: row.menu_item_id || null,
      unit_price: Number(row.unit_price || 0),
      quantity: row.quantity || 1,
      seat_number: row.seat_number || null,
      course: row.course || "main",
      destination_station: row.destination_station || row.station || "kitchen",
      status: row.status || "pending",
      modifiers: row.modifiers || null,
      cooking_preference: row.cooking_preference || null,
      allergy_notes: row.allergy_notes || null,
      special_instructions: row.special_instructions || null,
      created_by: row.created_by || null,
      sent_at: row.sent_at || null,
      started_at: row.started_at || null,
      ready_at: row.ready_at || null,
      served_at: row.served_at || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
