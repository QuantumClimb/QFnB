export type OrderStatus =
  | "open"
  | "sent"
  | "in_progress"
  | "ready"
  | "partially_served"
  | "served"
  | "completed"
  | "cancelled";

export type OrderItemStatus =
  | "pending" // Canonical unsent item status: editable item not yet sent to kitchen/bar
  | "draft"   // Backward compatibility alias for pending
  | "sent"
  | "accepted"
  | "preparing"
  | "ready"
  | "served"
  | "cancelled";

export type CourseType =
  | "drinks"
  | "starter"
  | "main"
  | "side"
  | "dessert"
  | "other";

export type ServiceStation =
  | "kitchen"
  | "bar"
  | "dessert"
  | "service";

export type OrderViewMode =
  | "ACTIVE"
  | "READY"
  | "SERVICE_BOARD"
  | "MY_TABLES"
  | "ALL";

export type ServiceStationFilter = "all" | ServiceStation;

export interface MenuItemModifierOption {
  id: string;
  name: string;
  priceDelta?: number;
}

export interface MenuItemModifierGroup {
  id: string;
  name: string;
  options: MenuItemModifierOption[];
  allowMultiple?: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  unit_price: number;
  course: CourseType;
  default_station: ServiceStation;
  available: boolean;
  modifier_groups?: MenuItemModifierGroup[];
  common_allergies?: string[];
}

export interface MenuCategory {
  id: string;
  name: string;
  icon?: string;
  itemsCount?: number;
}

export interface OrderItem {
  id: string;
  organization_id: string;
  outlet_id: string;
  order_id: string;

  item_name: string;
  menu_item_id?: string | null;
  unit_price: number;
  quantity: number;

  seat_number?: number | null;
  course: CourseType;
  destination_station: ServiceStation;

  status: OrderItemStatus;

  modifiers?: string[] | null;
  cooking_preference?: string | null;
  allergy_notes?: string[] | null;
  special_instructions?: string | null;

  created_by?: string | null;

  sent_at?: string | null;
  started_at?: string | null;
  ready_at?: string | null;
  served_at?: string | null;

  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  organization_id: string;
  outlet_id: string;

  table_id?: string | null;
  table_number?: string | null;
  reservation_id?: string | null;
  waitlist_entry_id?: string | null;

  guest_name?: string | null;
  order_number: string; // e.g. "ORD-101"

  status: OrderStatus;

  opened_by?: string | null;
  assigned_staff_id?: string | null;
  assigned_staff_name?: string | null;

  opened_at: string; // ISO string
  sent_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;

  notes?: string | null;

  items: OrderItem[];

  created_at: string;
  updated_at: string;
}

export interface OrderItemStatusHistoryItem {
  id: string;
  organization_id: string;
  outlet_id: string;
  order_item_id: string;
  old_status?: OrderItemStatus | null;
  new_status: OrderItemStatus;
  changed_by?: string | null;
  changed_at: string;
  note?: string | null;
}

export interface OpenOrderInput {
  table_id: string;
  guest_name?: string;
  reservation_id?: string;
  waitlist_entry_id?: string;
  assigned_staff_id?: string;
  notes?: string;
}

export interface AddOrderItemInput {
  menu_item_id?: string;
  item_name: string;
  unit_price: number;
  quantity: number;
  course?: CourseType;
  destination_station?: ServiceStation;
  seat_number?: number;
  modifiers?: string[];
  cooking_preference?: string;
  allergy_notes?: string[];
  special_instructions?: string;
}

export interface UpdateOrderItemInput {
  quantity?: number;
  seat_number?: number;
  course?: CourseType;
  destination_station?: ServiceStation;
  modifiers?: string[];
  cooking_preference?: string;
  allergy_notes?: string[];
  special_instructions?: string;
}

export interface OrderSummaryMetrics {
  activeOrdersCount: number;
  itemsPreparingCount: number;
  itemsReadyCount: number;
  averagePrepTimeMinutes: number;
  tablesWaitingCount: number;
  ordersCompletedToday: number;
}
