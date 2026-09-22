import type {
  Order,
  OrderItem,
  OpenOrderInput,
  AddOrderItemInput,
  UpdateOrderItemInput,
  OrderSummaryMetrics,
} from "../types";

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
}
