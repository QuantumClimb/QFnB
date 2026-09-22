import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  Order,
  OrderItem,
  OrderSummaryMetrics,
  OrderViewMode,
  ServiceStationFilter,
  OpenOrderInput,
  AddOrderItemInput,
  UpdateOrderItemInput,
  MenuItem,
  MenuCategory
} from "../types";
import { orderService, IOrderService } from "../services/orderService";
import { useOrg } from "../../../context/OrgContext";

interface OrderContextType {
  orders: Order[];
  summary: OrderSummaryMetrics | null;
  isLoading: boolean;

  // View & Filter State
  viewMode: OrderViewMode;
  stationFilter: ServiceStationFilter;
  searchQuery: string;
  courseFilter: string;
  setViewMode: (mode: OrderViewMode) => void;
  setStationFilter: (station: ServiceStationFilter) => void;
  setSearchQuery: (query: string) => void;
  setCourseFilter: (course: string) => void;

  // Modals & Active State
  selectedOrder: Order | null;
  activeOrderingOrder: Order | null;
  isNewOrderModalOpen: boolean;
  isFastOrderDrawerOpen: boolean;
  isOrderDetailDrawerOpen: boolean;
  toastMessage: string | null;

  // Menu catalog
  menuItems: MenuItem[];
  categories: MenuCategory[];

  // Actions
  refreshOrders: () => Promise<void>;
  openOrder: (input: OpenOrderInput) => Promise<Order>;
  addItem: (orderId: string, input: AddOrderItemInput) => Promise<OrderItem>;
  updateItem: (orderId: string, itemId: string, input: UpdateOrderItemInput) => Promise<OrderItem>;
  removeDraftItem: (orderId: string, itemId: string) => Promise<void>;
  sendOrder: (orderId: string) => Promise<Order>;
  acceptItem: (orderId: string, itemId: string) => Promise<OrderItem>;
  startPreparing: (orderId: string, itemId: string) => Promise<OrderItem>;
  markItemReady: (orderId: string, itemId: string) => Promise<OrderItem>;
  markItemServed: (orderId: string, itemId: string) => Promise<OrderItem>;
  cancelItem: (orderId: string, itemId: string, reason?: string) => Promise<OrderItem>;
  completeOrder: (orderId: string) => Promise<Order>;
  cancelOrder: (orderId: string, reason?: string) => Promise<Order>;

  // UI Handlers
  openNewOrderModal: () => void;
  closeNewOrderModal: () => void;
  startFastOrdering: (order: Order) => void;
  closeFastOrdering: () => void;
  openOrderDetail: (order: Order) => void;
  closeOrderDetail: () => void;
  clearToast: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({
  children,
  customOrderService,
}: {
  children: React.ReactNode;
  customOrderService?: IOrderService;
}) {
  const { currentOutlet } = useOrg();
  const oService = customOrderService || orderService;

  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<OrderSummaryMetrics | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [viewMode, setViewMode] = useState<OrderViewMode>("ACTIVE");
  const [stationFilter, setStationFilter] = useState<ServiceStationFilter>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [courseFilter, setCourseFilter] = useState<string>("all");

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeOrderingOrder, setActiveOrderingOrder] = useState<Order | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState<boolean>(false);
  const [isFastOrderDrawerOpen, setIsFastOrderDrawerOpen] = useState<boolean>(false);
  const [isOrderDetailDrawerOpen, setIsOrderDetailDrawerOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const refreshOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const [fetchedOrders, fetchedSummary, fetchedItems, fetchedCategories] = await Promise.all([
        oService.listOrders(currentOutlet?.id),
        oService.getOrderSummary(currentOutlet?.id),
        oService.listMenuItems(),
        oService.listCategories(),
      ]);

      setOrders(fetchedOrders);
      setSummary(fetchedSummary);
      setMenuItems(fetchedItems);
      setCategories(fetchedCategories);

      if (selectedOrder) {
        const updated = fetchedOrders.find((o) => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
      if (activeOrderingOrder) {
        const updated = fetchedOrders.find((o) => o.id === activeOrderingOrder.id);
        if (updated) setActiveOrderingOrder(updated);
      }
    } catch (err) {
      console.error("Failed to fetch orders data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentOutlet?.id, oService, selectedOrder, activeOrderingOrder]);

  useEffect(() => {
    refreshOrders();
  }, [currentOutlet?.id]);

  // Periodic refresh ticker for live prep timers
  useEffect(() => {
    const interval = setInterval(() => {
      refreshOrders();
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshOrders]);

  const openOrder = async (input: OpenOrderInput): Promise<Order> => {
    const order = await oService.openOrder(input, currentOutlet?.id);
    await refreshOrders();
    showToast(`Order #${order.order_number} opened for Table ${order.table_number || "Walk-In"}`);
    setIsNewOrderModalOpen(false);
    setActiveOrderingOrder(order);
    setIsFastOrderDrawerOpen(true);
    return order;
  };

  const addItem = async (orderId: string, input: AddOrderItemInput): Promise<OrderItem> => {
    const item = await oService.addItem(orderId, input);
    await refreshOrders();
    showToast(`Added ${item.quantity}x ${item.item_name}`);
    return item;
  };

  const updateItem = async (orderId: string, itemId: string, input: UpdateOrderItemInput): Promise<OrderItem> => {
    const item = await oService.updateItem(orderId, itemId, input);
    await refreshOrders();
    return item;
  };

  const removeDraftItem = async (orderId: string, itemId: string): Promise<void> => {
    await oService.removeDraftItem(orderId, itemId);
    await refreshOrders();
  };

  const sendOrder = async (orderId: string): Promise<Order> => {
    const order = await oService.sendOrder(orderId);
    await refreshOrders();
    setIsFastOrderDrawerOpen(false);
    showToast(`Order #${order.order_number} sent to Kitchen / Bar stations!`);
    return order;
  };

  const acceptItem = async (orderId: string, itemId: string): Promise<OrderItem> => {
    const item = await oService.acceptItem(orderId, itemId);
    await refreshOrders();
    showToast(`Accepted ${item.item_name} at station`);
    return item;
  };

  const startPreparing = async (orderId: string, itemId: string): Promise<OrderItem> => {
    const item = await oService.startPreparing(orderId, itemId);
    await refreshOrders();
    showToast(`Started cooking: ${item.item_name}`);
    return item;
  };

  const markItemReady = async (orderId: string, itemId: string): Promise<OrderItem> => {
    const item = await oService.markItemReady(orderId, itemId);
    await refreshOrders();
    showToast(`🔔 ${item.item_name} is READY for service!`);
    return item;
  };

  const markItemServed = async (orderId: string, itemId: string): Promise<OrderItem> => {
    const item = await oService.markItemServed(orderId, itemId);
    await refreshOrders();
    showToast(`Served ${item.item_name} to Table`);
    return item;
  };

  const cancelItem = async (orderId: string, itemId: string, reason?: string): Promise<OrderItem> => {
    const item = await oService.cancelItem(orderId, itemId, reason);
    await refreshOrders();
    showToast(`Cancelled ${item.item_name}`);
    return item;
  };

  const completeOrder = async (orderId: string): Promise<Order> => {
    const order = await oService.completeOrder(orderId);
    await refreshOrders();
    setIsOrderDetailDrawerOpen(false);
    showToast(`Order #${order.order_number} completed`);
    return order;
  };

  const cancelOrder = async (orderId: string, reason?: string): Promise<Order> => {
    const order = await oService.cancelOrder(orderId, reason);
    await refreshOrders();
    setIsOrderDetailDrawerOpen(false);
    showToast(`Order #${order.order_number} cancelled`);
    return order;
  };

  const openNewOrderModal = () => setIsNewOrderModalOpen(true);
  const closeNewOrderModal = () => setIsNewOrderModalOpen(false);

  const startFastOrdering = (order: Order) => {
    setActiveOrderingOrder(order);
    setIsFastOrderDrawerOpen(true);
  };
  const closeFastOrdering = () => {
    setActiveOrderingOrder(null);
    setIsFastOrderDrawerOpen(false);
  };

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderDetailDrawerOpen(true);
  };
  const closeOrderDetail = () => {
    setSelectedOrder(null);
    setIsOrderDetailDrawerOpen(false);
  };

  const clearToast = () => setToastMessage(null);

  // Apply filters
  const filteredOrders = orders.filter((order) => {
    // Mode filtering
    if (viewMode === "ACTIVE") {
      if (order.status === "completed" || order.status === "cancelled") return false;
    } else if (viewMode === "READY") {
      const hasReady = order.status === "ready" || order.items.some((i) => i.status === "ready");
      if (!hasReady) return false;
    }

    // Station filtering
    if (stationFilter !== "all") {
      const hasStationItem = order.items.some((i) => i.destination_station === stationFilter);
      if (!hasStationItem) return false;
    }

    // Course filtering
    if (courseFilter !== "all") {
      const hasCourse = order.items.some((i) => i.course === courseFilter);
      if (!hasCourse) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = order.order_number.toLowerCase().includes(q);
      const matchTbl = (order.table_number || "").toLowerCase().includes(q);
      const matchGuest = (order.guest_name || "").toLowerCase().includes(q);
      const matchItem = order.items.some((i) => i.item_name.toLowerCase().includes(q));
      return matchNum || matchTbl || matchGuest || matchItem;
    }

    return true;
  });

  return (
    <OrderContext.Provider
      value={{
        orders: filteredOrders,
        summary,
        isLoading,
        viewMode,
        stationFilter,
        searchQuery,
        courseFilter,
        setViewMode,
        setStationFilter,
        setSearchQuery,
        setCourseFilter,
        selectedOrder,
        activeOrderingOrder,
        isNewOrderModalOpen,
        isFastOrderDrawerOpen,
        isOrderDetailDrawerOpen,
        toastMessage,
        menuItems,
        categories,
        refreshOrders,
        openOrder,
        addItem,
        updateItem,
        removeDraftItem,
        sendOrder,
        acceptItem,
        startPreparing,
        markItemReady,
        markItemServed,
        cancelItem,
        completeOrder,
        cancelOrder,
        openNewOrderModal,
        closeNewOrderModal,
        startFastOrdering,
        closeFastOrdering,
        openOrderDetail,
        closeOrderDetail,
        clearToast,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders(): OrderContextType {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrders must be used within an OrderProvider");
  }
  return context;
}
