import React from "react";
import { OrderProvider, useOrders } from "../features/orders";
import { OrdersHeader } from "../features/orders/components/OrdersHeader";
import { OrdersFilters } from "../features/orders/components/OrdersFilters";
import { ActiveOrdersList } from "../features/orders/components/ActiveOrdersList";
import { ServiceBoardView } from "../features/orders/components/ServiceBoardView";
import { WaiterMyTablesView } from "../features/orders/components/WaiterMyTablesView";
import { NewOrderModal } from "../features/orders/components/NewOrderModal";
import { FastOrderEntryDrawer } from "../features/orders/components/FastOrderEntryDrawer";
import { OrderDetailDrawer } from "../features/orders/components/OrderDetailDrawer";
import { CheckCircle, X } from "lucide-react";

function OrdersWorkspace() {
  const { viewMode, toastMessage, clearToast } = useOrders();

  return (
    <div className="space-y-5">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-purple-400 text-zinc-950 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-mono text-xs font-bold animate-in slide-in-from-top duration-200">
          <CheckCircle className="w-4 h-4 stroke-[2.5]" />
          <span>{toastMessage}</span>
          <button 
            onClick={clearToast}
            className="p-1 hover:bg-black/10 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header & Operational Metrics */}
      <OrdersHeader />

      {/* Filter Bar */}
      <OrdersFilters />

      {/* Main Workspace Display based on Active View Mode */}
      <div>
        {viewMode === "SERVICE_BOARD" ? (
          <ServiceBoardView />
        ) : viewMode === "MY_TABLES" ? (
          <WaiterMyTablesView />
        ) : (
          <ActiveOrdersList />
        )}
      </div>

      {/* Modals & Slide-Over Drawers */}
      <NewOrderModal />
      <FastOrderEntryDrawer />
      <OrderDetailDrawer />
    </div>
  );
}

export function OrdersPage() {
  return (
    <OrderProvider>
      <OrdersWorkspace />
    </OrderProvider>
  );
}

export default OrdersPage;
