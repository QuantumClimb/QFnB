import {
  Order,
  OrderItem,
  OrderStatus,
  OrderItemStatus,
  MenuItem,
  MenuCategory,
  OpenOrderInput,
  AddOrderItemInput,
  UpdateOrderItemInput,
  OrderSummaryMetrics,
  OrderItemStatusHistoryItem
} from "../types";
import { initialOrdersFixtures, initialMenuItems, initialMenuCategories } from "../fixtures/orderFixtures";
import { floorService, IFloorService } from "../../floor/services/floorService";

export interface IOrderService {
  listOrders(outletId?: string, statusFilter?: string): Promise<Order[]>;
  getOrder(orderId: string): Promise<Order | null>;
  getActiveOrderForTable(tableId: string): Promise<Order | null>;
  openOrder(input: OpenOrderInput, outletId?: string): Promise<Order>;
  addItem(orderId: string, input: AddOrderItemInput): Promise<OrderItem>;
  updateItem(orderId: string, itemId: string, input: UpdateOrderItemInput): Promise<OrderItem>;
  removeDraftItem(orderId: string, itemId: string): Promise<void>;
  sendOrder(orderId: string): Promise<Order>;
  acceptItem(orderId: string, itemId: string): Promise<OrderItem>;
  startPreparing(orderId: string, itemId: string): Promise<OrderItem>;
  markItemReady(orderId: string, itemId: string): Promise<OrderItem>;
  markItemServed(orderId: string, itemId: string): Promise<OrderItem>;
  cancelItem(orderId: string, itemId: string, reason?: string): Promise<OrderItem>;
  completeOrder(orderId: string): Promise<Order>;
  cancelOrder(orderId: string, reason?: string): Promise<Order>;
  getOrderSummary(outletId?: string): Promise<OrderSummaryMetrics>;
  listMenuItems(category?: string): Promise<MenuItem[]>;
  listCategories(): Promise<MenuCategory[]>;
}

const VALID_ITEM_TRANSITIONS: Record<OrderItemStatus, OrderItemStatus[]> = {
  pending: ["sent", "cancelled"],
  draft: ["sent", "cancelled"],
  sent: ["accepted", "preparing", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["served", "cancelled"],
  served: [],
  cancelled: [],
};

export class FixtureOrderService implements IOrderService {
  private orders: Order[];
  private menuItems: MenuItem[];
  private categories: MenuCategory[];
  private itemHistory: OrderItemStatusHistoryItem[] = [];
  private floorSvc: IFloorService;

  constructor(customFloorService?: IFloorService) {
    this.orders = JSON.parse(JSON.stringify(initialOrdersFixtures));
    this.menuItems = JSON.parse(JSON.stringify(initialMenuItems));
    this.categories = JSON.parse(JSON.stringify(initialMenuCategories));
    this.floorSvc = customFloorService || floorService;
  }

  async listOrders(_outletId?: string, statusFilter?: string): Promise<Order[]> {
    await new Promise((res) => setTimeout(res, 40));
    let result = [...this.orders];

    if (statusFilter && statusFilter !== "ALL") {
      const lower = statusFilter.toLowerCase();
      if (lower === "active") {
        result = result.filter(
          (o) => o.status === "open" || o.status === "sent" || o.status === "in_progress" || o.status === "partially_served"
        );
      } else if (lower === "ready") {
        result = result.filter((o) => o.status === "ready" || o.items.some((i) => i.status === "ready"));
      } else {
        result = result.filter((o) => o.status === lower);
      }
    }

    // Sort by opened_at DESC
    result.sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime());
    return result;
  }

  async getOrder(orderId: string): Promise<Order | null> {
    await new Promise((res) => setTimeout(res, 30));
    const order = this.orders.find((o) => o.id === orderId);
    return order ? JSON.parse(JSON.stringify(order)) : null;
  }

  async getActiveOrderForTable(tableId: string): Promise<Order | null> {
    await new Promise((res) => setTimeout(res, 30));
    const order = this.orders.find(
      (o) => o.table_id === tableId && o.status !== "completed" && o.status !== "cancelled"
    );
    return order ? JSON.parse(JSON.stringify(order)) : null;
  }

  async openOrder(input: OpenOrderInput, _outletId?: string): Promise<Order> {
    await new Promise((res) => setTimeout(res, 60));

    const table = await this.floorSvc.getTable(input.table_id);
    if (!table) throw new Error(`Table ${input.table_id} not found`);

    // Phase 3F.1 Hardening: Prevent multiple active orders per table
    const existingOrder = await this.getActiveOrderForTable(table.id);
    if (existingOrder) {
      throw new Error(
        `Table ${table.table_number} already has an active service order (${existingOrder.order_number}). A table may only have one active order at a time.`
      );
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const seqNum = (this.orders.length + 101).toString().padStart(3, "0");
    const nextOrderNum = `ORD-${dateStr}-${seqNum}`;
    const nowIso = new Date().toISOString();

    const newOrder: Order = {
      id: `ord-${Date.now().toString().slice(-4)}`,
      organization_id: "org-001",
      outlet_id: "out-001",
      table_id: table.id,
      table_number: table.table_number,
      guest_name: input.guest_name || table.current_session?.guestName || `Table ${table.table_number} Guest`,
      reservation_id: input.reservation_id || table.current_session?.reservationId || null,
      waitlist_entry_id: input.waitlist_entry_id || null,
      order_number: nextOrderNum,
      status: "open",
      opened_by: input.assigned_staff_id || "prof-staff-1",
      assigned_staff_id: input.assigned_staff_id || "prof-staff-1",
      assigned_staff_name: "David K. (Floor Server)",
      opened_at: nowIso,
      notes: input.notes || null,
      items: [],
      created_at: nowIso,
      updated_at: nowIso,
    };

    this.orders.unshift(newOrder);

    // Floor Status Ownership: Transition seated table to ordering
    if (table.status === "seated") {
      await this.floorSvc.changeTableStatus(table.id, "ordering", "Order opened at table");
    }

    return JSON.parse(JSON.stringify(newOrder));
  }

  async addItem(orderId: string, input: AddOrderItemInput): Promise<OrderItem> {
    await new Promise((res) => setTimeout(res, 40));
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const nowIso = new Date().toISOString();
    // Phase 3F.1 Semantics: 'pending' is canonical for unsent/draft items
    const newItem: OrderItem = {
      id: `item-${Date.now().toString().slice(-5)}`,
      organization_id: order.organization_id,
      outlet_id: order.outlet_id,
      order_id: order.id,
      item_name: input.item_name,
      menu_item_id: input.menu_item_id || null,
      unit_price: input.unit_price,
      quantity: input.quantity || 1,
      seat_number: input.seat_number || null,
      course: input.course || "main",
      destination_station: input.destination_station || "kitchen",
      status: "pending",
      modifiers: input.modifiers || null,
      cooking_preference: input.cooking_preference || null,
      allergy_notes: input.allergy_notes || null,
      special_instructions: input.special_instructions || null,
      created_at: nowIso,
      updated_at: nowIso,
    };

    order.items.push(newItem);
    order.updated_at = nowIso;
    this.recordItemHistory(newItem.id, null, "pending", "Item added to pending order");

    return JSON.parse(JSON.stringify(newItem));
  }

  async updateItem(orderId: string, itemId: string, input: UpdateOrderItemInput): Promise<OrderItem> {
    await new Promise((res) => setTimeout(res, 40));
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const item = order.items.find((i) => i.id === itemId);
    if (!item) throw new Error(`Item ${itemId} not found`);

    if (input.quantity !== undefined) item.quantity = input.quantity;
    if (input.seat_number !== undefined) item.seat_number = input.seat_number;
    if (input.course !== undefined) item.course = input.course;
    if (input.destination_station !== undefined) item.destination_station = input.destination_station;
    if (input.modifiers !== undefined) item.modifiers = input.modifiers;
    if (input.cooking_preference !== undefined) item.cooking_preference = input.cooking_preference;
    if (input.allergy_notes !== undefined) item.allergy_notes = input.allergy_notes;
    if (input.special_instructions !== undefined) item.special_instructions = input.special_instructions;

    item.updated_at = new Date().toISOString();
    order.updated_at = new Date().toISOString();
    return JSON.parse(JSON.stringify(item));
  }

  async removeDraftItem(orderId: string, itemId: string): Promise<void> {
    await new Promise((res) => setTimeout(res, 30));
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const item = order.items.find((i) => i.id === itemId);
    if (!item) throw new Error(`Item ${itemId} not found`);

    if (item.status !== "pending" && item.status !== "draft") {
      throw new Error(`Cannot remove item with status '${item.status}'. Only pending/draft items can be removed.`);
    }

    order.items = order.items.filter((i) => i.id !== itemId);
    order.updated_at = new Date().toISOString();
  }

  async sendOrder(orderId: string): Promise<Order> {
    await new Promise((res) => setTimeout(res, 70));
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const nowIso = new Date().toISOString();

    // Transition all pending/draft items to sent
    order.items.forEach((item) => {
      if (item.status === "pending" || item.status === "draft") {
        this.assertValidTransition(item.status, "sent", item.id);
        const oldStatus = item.status;
        item.status = "sent";
        item.sent_at = nowIso;
        item.updated_at = nowIso;
        this.recordItemHistory(item.id, oldStatus, "sent", "Order sent to station");
      }
    });

    order.sent_at = nowIso;
    order.status = "in_progress";
    order.updated_at = nowIso;

    // Floor Status Ownership: Transition ordering table to dining
    if (order.table_id) {
      await this.floorSvc.changeTableStatus(order.table_id, "dining", "First course sent to kitchen/bar");
    }

    return JSON.parse(JSON.stringify(order));
  }

  async acceptItem(orderId: string, itemId: string): Promise<OrderItem> {
    await new Promise((res) => setTimeout(res, 40));
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const item = order.items.find((i) => i.id === itemId);
    if (!item) throw new Error(`Item ${itemId} not found`);

    const oldStatus = item.status;
    this.assertValidTransition(oldStatus, "accepted", item.id);

    item.status = "accepted";
    item.updated_at = new Date().toISOString();
    this.recordItemHistory(item.id, oldStatus, "accepted", "Ticket accepted by station chef/bartender");

    this.deriveOrderStatus(order);
    return JSON.parse(JSON.stringify(item));
  }

  async startPreparing(orderId: string, itemId: string): Promise<OrderItem> {
    await new Promise((res) => setTimeout(res, 40));
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const item = order.items.find((i) => i.id === itemId);
    if (!item) throw new Error(`Item ${itemId} not found`);

    const nowIso = new Date().toISOString();
    const oldStatus = item.status;
    this.assertValidTransition(oldStatus, "preparing", item.id);

    item.status = "preparing";
    item.started_at = nowIso;
    item.updated_at = nowIso;
    this.recordItemHistory(item.id, oldStatus, "preparing", "Started cooking / preparation");

    this.deriveOrderStatus(order);
    return JSON.parse(JSON.stringify(item));
  }

  async markItemReady(orderId: string, itemId: string): Promise<OrderItem> {
    await new Promise((res) => setTimeout(res, 50));
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const item = order.items.find((i) => i.id === itemId);
    if (!item) throw new Error(`Item ${itemId} not found`);

    const nowIso = new Date().toISOString();
    const oldStatus = item.status;
    this.assertValidTransition(oldStatus, "ready", item.id);

    item.status = "ready";
    item.ready_at = nowIso;
    item.updated_at = nowIso;
    this.recordItemHistory(item.id, oldStatus, "ready", "Item is ready on the pass / bar counter");

    this.deriveOrderStatus(order);
    return JSON.parse(JSON.stringify(item));
  }

  async markItemServed(orderId: string, itemId: string): Promise<OrderItem> {
    await new Promise((res) => setTimeout(res, 50));
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const item = order.items.find((i) => i.id === itemId);
    if (!item) throw new Error(`Item ${itemId} not found`);

    const nowIso = new Date().toISOString();
    const oldStatus = item.status;
    this.assertValidTransition(oldStatus, "served", item.id);

    item.status = "served";
    item.served_at = nowIso;
    item.updated_at = nowIso;
    this.recordItemHistory(item.id, oldStatus, "served", "Item delivered to table");

    this.deriveOrderStatus(order);
    return JSON.parse(JSON.stringify(item));
  }

  async cancelItem(orderId: string, itemId: string, reason?: string): Promise<OrderItem> {
    await new Promise((res) => setTimeout(res, 40));
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const item = order.items.find((i) => i.id === itemId);
    if (!item) throw new Error(`Item ${itemId} not found`);

    const oldStatus = item.status;
    this.assertValidTransition(oldStatus, "cancelled", item.id);

    item.status = "cancelled";
    item.updated_at = new Date().toISOString();
    this.recordItemHistory(item.id, oldStatus, "cancelled", reason || "Item cancelled");

    this.deriveOrderStatus(order);
    return JSON.parse(JSON.stringify(item));
  }

  async completeOrder(orderId: string): Promise<Order> {
    await new Promise((res) => setTimeout(res, 60));
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const nowIso = new Date().toISOString();
    order.status = "completed";
    order.completed_at = nowIso;
    order.updated_at = nowIso;

    // Floor Status Ownership (Phase 3F.1 Hardening):
    // Completing an order does NOT automatically advance table status to 'bill_requested',
    // 'cleaning', or 'available'. Table turnover and bill requests are service operations
    // owned exclusively by floor staff on the Floor Plan.
    return JSON.parse(JSON.stringify(order));
  }

  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    await new Promise((res) => setTimeout(res, 50));
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const nowIso = new Date().toISOString();
    order.status = "cancelled";
    order.cancelled_at = nowIso;
    order.notes = reason ? `${order.notes ? order.notes + " | " : ""}Cancelled: ${reason}` : order.notes;
    order.updated_at = nowIso;

    return JSON.parse(JSON.stringify(order));
  }

  async getOrderSummary(_outletId?: string): Promise<OrderSummaryMetrics> {
    await new Promise((res) => setTimeout(res, 30));

    const activeOrders = this.orders.filter(
      (o) => o.status === "open" || o.status === "sent" || o.status === "in_progress" || o.status === "partially_served"
    );

    let itemsPreparing = 0;
    let itemsReady = 0;
    const prepDurationsMinutes: number[] = [];

    this.orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.status === "preparing") itemsPreparing += item.quantity;
        if (item.status === "ready") itemsReady += item.quantity;

        if (item.started_at && item.ready_at) {
          const durMs = new Date(item.ready_at).getTime() - new Date(item.started_at).getTime();
          prepDurationsMinutes.push(Math.max(1, Math.round(durMs / 60000)));
        } else if (item.started_at && item.status === "preparing") {
          const durMs = Date.now() - new Date(item.started_at).getTime();
          prepDurationsMinutes.push(Math.max(1, Math.round(durMs / 60000)));
        }
      });
    });

    const averagePrepTimeMinutes =
      prepDurationsMinutes.length > 0
        ? Math.round(prepDurationsMinutes.reduce((a, b) => a + b, 0) / prepDurationsMinutes.length)
        : 14;

    const tablesWaitingCount = activeOrders.filter((o) => o.items.some((i) => i.status === "sent" || i.status === "preparing")).length;
    const ordersCompletedToday = this.orders.filter((o) => o.status === "completed").length;

    return {
      activeOrdersCount: activeOrders.length,
      itemsPreparingCount: itemsPreparing,
      itemsReadyCount: itemsReady,
      averagePrepTimeMinutes,
      tablesWaitingCount,
      ordersCompletedToday,
    };
  }

  async listMenuItems(category?: string): Promise<MenuItem[]> {
    await new Promise((res) => setTimeout(res, 30));
    if (!category || category === "all") return this.menuItems;
    return this.menuItems.filter((i) => i.category === category);
  }

  async listCategories(): Promise<MenuCategory[]> {
    await new Promise((res) => setTimeout(res, 20));
    return this.categories;
  }

  private deriveOrderStatus(order: Order) {
    if (order.status === "completed" || order.status === "cancelled") return;

    const nonCancelledItems = order.items.filter((i) => i.status !== "cancelled");
    if (nonCancelledItems.length === 0) {
      order.status = "open";
      order.updated_at = new Date().toISOString();
      return;
    }

    const allServed = nonCancelledItems.every((i) => i.status === "served");
    const anyServed = nonCancelledItems.some((i) => i.status === "served");
    const allReady = nonCancelledItems.every((i) => i.status === "ready");
    const anyPreparingOrReady = nonCancelledItems.some((i) => i.status === "preparing" || i.status === "ready" || i.status === "accepted");
    const allSent = nonCancelledItems.every((i) => i.status === "sent");
    const anySent = nonCancelledItems.some((i) => i.status === "sent");
    const allPending = nonCancelledItems.every((i) => i.status === "pending" || i.status === "draft");

    if (allServed) {
      order.status = "served";
    } else if (anyServed) {
      // Some items served, others remaining in prep/ready/sent/pending
      order.status = "partially_served";
    } else if (allReady) {
      order.status = "ready";
    } else if (anyPreparingOrReady) {
      order.status = "in_progress";
    } else if (allSent) {
      order.status = "sent";
    } else if (anySent) {
      order.status = "in_progress";
    } else if (allPending) {
      order.status = "open";
    } else {
      order.status = "in_progress";
    }

    order.updated_at = new Date().toISOString();
  }

  private assertValidTransition(currentStatus: OrderItemStatus, targetStatus: OrderItemStatus, itemId: string) {
    const validTargets = VALID_ITEM_TRANSITIONS[currentStatus] || [];
    if (!validTargets.includes(targetStatus)) {
      throw new Error(
        `Invalid item transition: item ${itemId} with status '${currentStatus}' cannot transition to '${targetStatus}'. Allowed: [${validTargets.join(", ")}]`
      );
    }
  }

  private recordItemHistory(
    itemId: string,
    oldStatus: OrderItemStatus | null,
    newStatus: OrderItemStatus,
    note?: string,
    changedBy?: string
  ) {
    this.itemHistory.push({
      id: `oih-${Date.now().toString().slice(-4)}`,
      organization_id: "org-001",
      outlet_id: "out-001",
      order_item_id: itemId,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: changedBy || null,
      changed_at: new Date().toISOString(),
      note: note || null,
    });
  }
}

export const orderService: IOrderService = new FixtureOrderService();
