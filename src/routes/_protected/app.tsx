import { useState, useSyncExternalStore } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { siteConfig } from "@/config/site";
import {
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_SHIFT,
  INITIAL_PAST_SHIFTS,
  INITIAL_SYNC_QUEUE,
} from "@/components/pos/mock-data";
import type {
  CompletedOrder,
  ShiftData,
  PastShift,
  SyncQueueItem,
  PaymentMethod,
} from "@/components/pos/types";
import { PosOrderView } from "@/components/pos/pos-order-view";
import { PosOrdersHistoryView } from "@/components/pos/pos-orders-history-view";
import { PosShiftView } from "@/components/pos/pos-shift-view";
import { PosSyncView } from "@/components/pos/pos-sync-view";
import { PosSidebar } from "@/components/pos/pos-sidebar";
import type { PosTab } from "@/components/pos/pos-sidebar";
import { PosReceiptModal } from "@/components/pos/pos-receipt-modal";
import { TopBar } from "@/components/common/top-bar";
import { NotificationsView } from "@/components/common/notifications-view";
import { Clock, Wifi, WifiOff } from "lucide-react";

export const Route = createFileRoute("/_protected/app")({
  head: () => ({ meta: [{ title: `Kasir POS | ${siteConfig.name}` }] }),
  component: PosAppPage,
});

function subscribeNetwork(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export function PosAppPage() {
  const { session } = Route.useRouteContext();
  const cashierName = session.user.name || "Budi Santoso";

  // Sidebar Collapse & Mobile Drawer States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Tab State with lazy initializer
  const [activeTab, setActiveTab] = useState<PosTab>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam && ["pos", "orders", "shift", "sync", "notifications"].includes(tabParam)) {
        return tabParam as PosTab;
      }
    }
    return "pos";
  });

  const switchTab = (tab: PosTab) => {
    setActiveTab(tab);
    setIsMobileSidebarOpen(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  };

  // State Management
  const [orders, setOrders] = useState<CompletedOrder[]>(INITIAL_ORDERS);
  const [shift, setShift] = useState<ShiftData>({
    ...INITIAL_SHIFT,
    cashierName,
  });
  const [pastShifts, setPastShifts] = useState<PastShift[]>(INITIAL_PAST_SHIFTS);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>(INITIAL_SYNC_QUEUE);
  const [justCompletedOrder, setJustCompletedOrder] = useState<CompletedOrder | null>(null);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);

  // Network State
  const rawIsOnline = useSyncExternalStore(
    subscribeNetwork,
    () => navigator.onLine,
    () => true
  );

  const effectiveIsOnline = isSimulatedOffline ? false : rawIsOnline;

  // Handlers
  const handleOrderComplete = (orderData: {
    items: { productId: string; name: string; quantity: number; price: number; subtotal: number; notes?: string }[];
    subtotal: number;
    discount?: number;
    promoCode?: string;
    promoName?: string;
    tax: number;
    total: number;
    paymentMethod: PaymentMethod;
    amountTendered: number;
    change: number;
  }) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
    const dateFormatted = now.toISOString().slice(0, 10);
    const orderNum = `MAC-${dateFormatted.replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: CompletedOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      items: orderData.items,
      subtotal: orderData.subtotal,
      discount: orderData.discount,
      promoCode: orderData.promoCode,
      promoName: orderData.promoName,
      tax: orderData.tax,
      total: orderData.total,
      paymentMethod: orderData.paymentMethod,
      amountTendered: orderData.amountTendered,
      change: orderData.change,
      timestamp: timeStr,
      dateStr: dateFormatted,
      cashierName,
      syncStatus: effectiveIsOnline ? "SYNCED" : "PENDING_SYNC",
      status: "PAID",
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Update Shift calculations
    setShift((prev) => {
      const isCash = orderData.paymentMethod === "CASH";
      const newCashSales = isCash ? prev.cashSales + orderData.total : prev.cashSales;
      const newQrisSales = !isCash ? prev.qrisSales + orderData.total : prev.qrisSales;
      return {
        ...prev,
        cashSales: newCashSales,
        qrisSales: newQrisSales,
        orderCount: prev.orderCount + 1,
        expectedCash: prev.initialCash + newCashSales,
      };
    });

    // Queue for sync
    const syncItem: SyncQueueItem = {
      id: `sync-${Date.now()}`,
      orderNumber: orderNum,
      createdAt: `${dateFormatted} ${timeStr}`,
      total: orderData.total,
      paymentMethod: orderData.paymentMethod,
      syncStatus: effectiveIsOnline ? "SYNCED" : "PENDING_SYNC",
      syncedAt: effectiveIsOnline ? `${dateFormatted} ${timeStr}` : undefined,
      retryCount: 0,
    };
    setSyncQueue((prev) => [syncItem, ...prev]);

    // Trigger Digital Receipt
    setJustCompletedOrder(newOrder);
  };

  const handleVoidOrder = (orderId: string, reason: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;

    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              status: "VOID",
              voidReason: reason,
            }
          : ord
      )
    );

    // Reconcile Shift if voided
    if (target.status === "PAID") {
      setShift((prev) => {
        const isCash = target.paymentMethod === "CASH";
        const newCashSales = isCash ? prev.cashSales - target.total : prev.cashSales;
        const newQrisSales = !isCash ? prev.qrisSales - target.total : prev.qrisSales;
        return {
          ...prev,
          cashSales: Math.max(0, newCashSales),
          qrisSales: Math.max(0, newQrisSales),
          orderCount: Math.max(0, prev.orderCount - 1),
          expectedCash: Math.max(prev.initialCash, prev.initialCash + newCashSales),
        };
      });
    }
  };

  const handleOpenShift = (initialCash: number) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
    const dateFormatted = now.toISOString().slice(0, 10).replace(/-/g, "");

    setShift({
      id: `shift-${dateFormatted}-01`,
      status: "OPEN",
      cashierName,
      startTime: timeStr,
      initialCash,
      cashSales: 0,
      qrisSales: 0,
      orderCount: 0,
      expectedCash: initialCash,
    });
  };

  const handleCloseShift = (actualCash: number, notes: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
    const dateStr = now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const diff = actualCash - shift.expectedCash;

    const archivedShift: PastShift = {
      id: shift.id,
      date: dateStr,
      cashierName: shift.cashierName,
      shiftName: "Shift Pagi",
      startTime: shift.startTime,
      endTime: timeStr,
      initialCash: shift.initialCash,
      cashSales: shift.cashSales,
      qrisSales: shift.qrisSales,
      expectedCash: shift.expectedCash,
      actualCash,
      cashDifference: diff,
      status: "CLOSED",
      notes: notes || (diff === 0 ? "Tutup shift tanpa selisih kas." : `Selisih kas ${diff}`),
    };

    setPastShifts((prev) => [archivedShift, ...prev]);
    setShift((prev) => ({
      ...prev,
      status: "CLOSED",
      endTime: timeStr,
      actualCash,
      cashDifference: diff,
      notes,
    }));
  };

  const handleForceSync = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = `${dateStr} ${now.toTimeString().slice(0, 8)}`;

    setSyncQueue((prev) =>
      prev.map((item) => ({
        ...item,
        syncStatus: "SYNCED",
        syncedAt: item.syncedAt || timeStr,
      }))
    );

    setOrders((prev) =>
      prev.map((ord) => ({
        ...ord,
        syncStatus: "SYNCED",
      }))
    );
  };

  const pendingSyncCount = syncQueue.filter((i) => i.syncStatus === "PENDING_SYNC").length;

  return (
    <div className="flex-1 flex h-screen w-screen overflow-hidden bg-brand-cream-50/50">
      {/* Collapsible Sidebar (Left side, full height) */}
      <PosSidebar
        activeTab={activeTab}
        onTabChange={switchTab}
        cartItemCount={0}
        orderCount={orders.length}
        isShiftOpen={shift.status === "OPEN"}
        pendingSyncCount={pendingSyncCount}
        unreadNotifCount={2}
        cashierName={cashierName}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main View Area (Right side) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TopBar (Reference Image 3: Welcome + Name, Notification Bell, User Avatar) */}
        <TopBar
          userName={cashierName}
          roleLabel="Kasir Outlet"
          unreadNotifCount={2}
          onOpenNotifications={() => switchTab("notifications")}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          extraActions={
            <div className="flex items-center gap-2">
              {/* Shift status pill */}
              <button
                type="button"
                onClick={() => switchTab("shift")}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-cream-100 hover:bg-brand-cream-200 text-brand-green-900 font-semibold text-xs transition-colors cursor-pointer"
                title="Buka Rekap Shift"
              >
                <Clock className="size-3 text-brand-green-800" />
                <span>{shift.status === "OPEN" ? "Shift Buka" : "Shift Tutup"}</span>
              </button>

              {/* Sync status indicator */}
              <button
                type="button"
                onClick={() => switchTab("sync")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  effectiveIsOnline
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                    : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                }`}
                title="Status Sinkronisasi & Offline"
              >
                {effectiveIsOnline ? (
                  <>
                    <Wifi className="size-3 text-emerald-600" />
                    <span className="hidden sm:inline text-[11px]">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="size-3 text-amber-600" />
                    <span className="hidden sm:inline text-[11px]">{pendingSyncCount} Antrean</span>
                  </>
                )}
              </button>
            </div>
          }
        />

        {/* Tab Content Rendering */}
        <main className="flex-1 flex overflow-hidden">
          {activeTab === "pos" && (
            <PosOrderView
              products={INITIAL_PRODUCTS}
              onOrderComplete={handleOrderComplete}
            />
          )}

          {activeTab === "orders" && (
            <PosOrdersHistoryView
              orders={orders}
              onVoidOrder={handleVoidOrder}
            />
          )}

          {activeTab === "shift" && (
            <PosShiftView
              shift={shift}
              pastShifts={pastShifts}
              onOpenShift={handleOpenShift}
              onCloseShift={handleCloseShift}
            />
          )}

          {activeTab === "sync" && (
            <PosSyncView
              isOnline={effectiveIsOnline}
              syncQueue={syncQueue}
              onForceSync={handleForceSync}
              onToggleSimulateOffline={() => setIsSimulatedOffline(!isSimulatedOffline)}
              isSimulatedOffline={isSimulatedOffline}
            />
          )}

          {activeTab === "notifications" && (
            <div className="flex-1 overflow-y-auto">
              <NotificationsView
                onNavigateTab={(tab) => switchTab(tab as PosTab)}
                onClose={() => switchTab("pos")}
              />
            </div>
          )}
        </main>
      </div>

      {/* Just Completed Order Receipt Modal */}
      {justCompletedOrder && (
        <PosReceiptModal
          order={justCompletedOrder}
          onClose={() => setJustCompletedOrder(null)}
          isReprint={false}
        />
      )}
    </div>
  );
}
