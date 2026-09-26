import { useEffect, useState, useSyncExternalStore } from "react";
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
  Product,
  CompletedOrder,
  ShiftData,
  PastShift,
  SyncQueueItem,
  PaymentMethod,
  OrderStatus,
} from "@/components/pos/types";
import { PosOrderView } from "@/components/pos/pos-order-view";
import { PosOrdersHistoryView } from "@/components/pos/pos-orders-history-view";
import { PosShiftView } from "@/components/pos/pos-shift-view";
import { PosSyncView } from "@/components/pos/pos-sync-view";
import { PosSidebar } from "@/components/pos/pos-sidebar";
import type { PosTab } from "@/components/pos/pos-sidebar";
import { PosReceiptModal } from "@/components/pos/pos-receipt-modal";
import {
  PosPinLockModal,
  type StaffPinAccount,
} from "@/components/pos/pos-pin-lock-modal";
import { TopBar } from "@/components/common/top-bar";
import { NotificationsView } from "@/components/common/notifications-view";
import { Clock, Wifi, WifiOff, Lock, Store } from "lucide-react";
import { INITIAL_BRANCHES } from "@/components/admin/mock-data";

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

  // Active Staff & Fast PIN State (Strictly 1 session = 1 authenticated staff)
  const isOwner =
    session.user.role === "admin" ||
    session.user.name?.toLowerCase().includes("afrizal");

  const activeStaff: StaffPinAccount = {
    id: session.user.id,
    name: session.user.name || (isOwner ? "Muhammad Afrizal" : "Budi Santoso"),
    role: isOwner ? "owner" : "cashier",
    roleLabel: isOwner ? "Business Owner" : "Kasir Shift Pagi",
    pin: isOwner ? "8899" : "1234",
    email: session.user.email,
  };

  const [isPinLockOpen, setIsPinLockOpen] = useState(false);
  const cashierName = activeStaff.name;

  // Active Branch resolution:
  // 1. From localStorage 'macmood_current_branch' (set by Owner PIN modal or branch switcher)
  // 2. Or from user email matching outlet
  // 3. Default to branch-1
  const [currentBranchId, setCurrentBranchId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("macmood_current_branch");
      if (stored) return stored;
    }
    const email = session.user.email?.toLowerCase() || "";
    if (email.includes("outlet2") || email.includes("margonda"))
      return "branch-2";
    if (email.includes("outlet3") || email.includes("tebet")) return "branch-3";
    return "branch-1";
  });

  const handleSwitchBranch = (branchId: string) => {
    setCurrentBranchId(branchId);
    if (typeof window !== "undefined") {
      localStorage.setItem("macmood_current_branch", branchId);
    }
  };

  const activeBranch =
    INITIAL_BRANCHES.find((b) => b.id === currentBranchId) ||
    INITIAL_BRANCHES[0];

  // Sidebar Collapse & Mobile Drawer States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Tab State with lazy initializer
  const [activeTab, setActiveTab] = useState<PosTab>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (
        tabParam &&
        ["pos", "orders", "shift", "sync", "notifications"].includes(tabParam)
      ) {
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

  // State Management with localStorage Persistence for offline resiliency
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<CompletedOrder[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("macmood_offline_orders");
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn("Failed to load cached orders:", e);
      }
    }
    return INITIAL_ORDERS;
  });
  const [shift, setShift] = useState<ShiftData>({
    ...INITIAL_SHIFT,
    cashierName,
  });
  const [pastShifts, setPastShifts] =
    useState<PastShift[]>(INITIAL_PAST_SHIFTS);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("macmood_offline_sync_queue");
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn("Failed to load cached syncQueue:", e);
      }
    }
    return INITIAL_SYNC_QUEUE;
  });
  const [justCompletedOrder, setJustCompletedOrder] =
    useState<CompletedOrder | null>(null);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);

  // Sync to localStorage whenever orders or syncQueue change
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("macmood_offline_orders", JSON.stringify(orders));
      } catch (e) {
        console.warn("Failed to save orders to localStorage:", e);
      }
    }
  }, [orders]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "macmood_offline_sync_queue",
          JSON.stringify(syncQueue),
        );
      } catch (e) {
        console.warn("Failed to save syncQueue to localStorage:", e);
      }
    }
  }, [syncQueue]);

  // Network State
  const rawIsOnline = useSyncExternalStore(
    subscribeNetwork,
    () => navigator.onLine,
    () => true,
  );

  const effectiveIsOnline = isSimulatedOffline ? false : rawIsOnline;

  // Load live data from PostgreSQL Backend
  useEffect(() => {
    let isMounted = true;
    async function loadBackendData() {
      try {
        const [prodRes, shiftRes, orderRes] = await Promise.allSettled([
          fetch("/api/catalog/products").then((r) => r.json()),
          fetch("/api/pos/shifts").then((r) => r.json()),
          fetch("/api/pos/orders?limit=30").then((r) => r.json()),
        ]);

        if (!isMounted) return;

        if (prodRes.status === "fulfilled" && prodRes.value?.data?.length > 0) {
          setProducts(
            (
              prodRes.value.data as Array<{
                id: string;
                name: string;
                categorySlug: string;
                price: number;
                description?: string;
                imageUrl?: string;
                isAvailable: boolean;
                currentStock: number;
              }>
            ).map((p) => ({
              id: p.id,
              name: p.name,
              category: (p.categorySlug === "sides" ||
              p.categorySlug === "drinks"
                ? p.categorySlug
                : "mac") as "mac" | "sides" | "drinks",
              price: p.price,
              description: p.description || "",
              image: p.imageUrl || "/assets/menu-super-mac-reference.png",
              isAvailable: p.isAvailable,
              stock: p.currentStock,
            })),
          );
        }

        if (shiftRes.status === "fulfilled") {
          const val = shiftRes.value as {
            active?: {
              id: string;
              status: string;
              staffName: string;
              startTime: string;
              initialCash: number;
              cashSales: number;
              qrisSales: number;
              totalOrders: number;
              expectedCash: number;
            };
            past?: Array<{
              id: string;
              staffName: string;
              startTime: string;
              endTime?: string;
              initialCash: number;
              cashSales: number;
              qrisSales: number;
              expectedCash: number;
              actualCash?: number;
              cashDifference: number;
              status: "OPEN" | "CLOSED";
              notes?: string;
            }>;
          };
          if (val.active) {
            setShift({
              id: val.active.id,
              status: val.active.status as "OPEN" | "CLOSED",
              cashierName: val.active.staffName,
              startTime:
                new Date(val.active.startTime).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                }) + " WIB",
              initialCash: val.active.initialCash,
              cashSales: val.active.cashSales,
              qrisSales: val.active.qrisSales,
              orderCount: val.active.totalOrders,
              expectedCash: val.active.expectedCash,
            });
          }
          if (val.past && val.past.length > 0) {
            setPastShifts(
              val.past.map((s) => ({
                id: s.id,
                date: new Date(s.startTime).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }),
                cashierName: s.staffName,
                shiftName: "Shift Reguler",
                startTime:
                  new Date(s.startTime).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }) + " WIB",
                endTime: s.endTime
                  ? new Date(s.endTime).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }) + " WIB"
                  : "-",
                initialCash: s.initialCash,
                cashSales: s.cashSales,
                qrisSales: s.qrisSales,
                expectedCash: s.expectedCash,
                actualCash: s.actualCash || 0,
                cashDifference: s.cashDifference,
                status: "CLOSED" as const,
                notes: s.notes || "",
              })),
            );
          }
        }

        if (
          orderRes.status === "fulfilled" &&
          orderRes.value?.data?.length > 0
        ) {
          setOrders(
            (
              orderRes.value.data as Array<{
                id: string;
                orderNumber: string;
                items?: Array<{
                  productId?: string;
                  productName: string;
                  quantity: number;
                  price: number;
                  subtotal: number;
                  notes?: string;
                }>;
                subtotal: number;
                discount?: number;
                promoCode?: string;
                promoName?: string;
                tax: number;
                total: number;
                paymentMethod: PaymentMethod;
                amountTendered?: number;
                changeAmount?: number;
                createdAt: string;
                cashierName: string;
                syncStatus?: "SYNCED" | "PENDING_SYNC";
                paymentStatus?: "PAID" | "REFUNDED" | "VOID";
              }>
            ).map((o) => ({
              id: o.id,
              orderNumber: o.orderNumber,
              items: (o.items || []).map((it) => ({
                productId: it.productId || it.productName,
                name: it.productName,
                quantity: it.quantity,
                price: it.price,
                subtotal: it.subtotal,
                notes: it.notes,
              })),
              subtotal: o.subtotal,
              discount: o.discount || 0,
              promoCode: o.promoCode,
              promoName: o.promoName,
              tax: o.tax,
              total: o.total,
              paymentMethod: o.paymentMethod,
              amountTendered: o.amountTendered || o.total,
              change: o.changeAmount || 0,
              timestamp:
                new Date(o.createdAt).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                }) + " WIB",
              dateStr: new Date(o.createdAt).toISOString().slice(0, 10),
              cashierName: o.cashierName,
              syncStatus: o.syncStatus || "SYNCED",
              status: (o.paymentStatus === "REFUNDED"
                ? "VOID"
                : o.paymentStatus || "PAID") as OrderStatus,
            })),
          );
        }
      } catch (err) {
        console.warn("Using offline fallback cache:", err);
      }
    }

    loadBackendData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handlers
  const handleOrderComplete = (orderData: {
    items: {
      productId: string;
      name: string;
      quantity: number;
      price: number;
      subtotal: number;
      notes?: string;
    }[];
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
    const timeStr =
      now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) +
      " WIB";
    const dateFormatted = now.toISOString().slice(0, 10);
    const orderNum = `MAC-${dateFormatted.replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: CompletedOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      branchId: activeBranch.id,
      branchName: activeBranch.name,
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
      const newCashSales = isCash
        ? prev.cashSales + orderData.total
        : prev.cashSales;
      const newQrisSales = !isCash
        ? prev.qrisSales + orderData.total
        : prev.qrisSales;
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

    // Push to Backend if online
    if (effectiveIsOnline) {
      fetch("/api/pos/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newOrder.id,
          orderNumber: newOrder.orderNumber,
          branchId: activeBranch.id,
          branchName: activeBranch.name,
          shiftId: shift.id?.startsWith("shift-") ? undefined : shift.id,
          cashierName,
          subtotal: newOrder.subtotal,
          discount: newOrder.discount || 0,
          promoCode: newOrder.promoCode,
          promoName: newOrder.promoName,
          tax: newOrder.tax,
          total: newOrder.total,
          paymentMethod:
            newOrder.paymentMethod === "QRIS_MANUAL"
              ? "QRIS"
              : newOrder.paymentMethod,
          amountTendered: newOrder.amountTendered,
          changeAmount: newOrder.change,
          syncStatus: "SYNCED",
          items: newOrder.items.map((it) => ({
            productId: it.productId?.startsWith("prod-")
              ? undefined
              : it.productId,
            productName: it.name,
            price: it.price,
            quantity: it.quantity,
            subtotal: it.subtotal,
            notes: it.notes,
          })),
        }),
      }).catch((err) => {
        console.warn("Offline fallback: order queued locally", err);
      });
    }

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
          : ord,
      ),
    );

    // Reconcile Shift if voided
    if (target.status === "PAID") {
      setShift((prev) => {
        const isCash = target.paymentMethod === "CASH";
        const newCashSales = isCash
          ? prev.cashSales - target.total
          : prev.cashSales;
        const newQrisSales = !isCash
          ? prev.qrisSales - target.total
          : prev.qrisSales;
        return {
          ...prev,
          cashSales: Math.max(0, newCashSales),
          qrisSales: Math.max(0, newQrisSales),
          orderCount: Math.max(0, prev.orderCount - 1),
          expectedCash: Math.max(
            prev.initialCash,
            prev.initialCash + newCashSales,
          ),
        };
      });
    }
  };

  const handleOpenShift = (initialCash: number) => {
    const now = new Date();
    const timeStr =
      now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) +
      " WIB";
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

    if (effectiveIsOnline) {
      fetch("/api/pos/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cashierName,
          initialCash,
        }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (res.data?.id) {
            setShift((prev) => ({ ...prev, id: res.data.id }));
          }
        })
        .catch(console.warn);
    }
  };

  const handleCloseShift = (actualCash: number, notes: string) => {
    const now = new Date();
    const timeStr =
      now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) +
      " WIB";
    const dateStr = now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
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
      notes:
        notes ||
        (diff === 0 ? "Tutup shift tanpa selisih kas." : `Selisih kas ${diff}`),
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

    if (effectiveIsOnline && !shift.id.startsWith("shift-")) {
      fetch("/api/pos/shifts/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftId: shift.id,
          actualCash,
          notes,
        }),
      }).catch(console.warn);
    }
  };

  const handleForceSync = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = `${dateStr} ${now.toTimeString().slice(0, 8)}`;

    const pendingOrders = orders.filter((o) => o.syncStatus === "PENDING_SYNC");
    if (pendingOrders.length > 0) {
      fetch("/api/pos/orders/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orders: pendingOrders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            shiftId: shift.id?.startsWith("shift-") ? undefined : shift.id,
            cashierName: o.cashierName,
            subtotal: o.subtotal,
            discount: o.discount || 0,
            promoCode: o.promoCode,
            promoName: o.promoName,
            tax: o.tax,
            total: o.total,
            paymentMethod:
              o.paymentMethod === "QRIS_MANUAL" ? "QRIS" : o.paymentMethod,
            amountTendered: o.amountTendered,
            changeAmount: o.change,
            syncStatus: "SYNCED",
            items: o.items.map((it) => ({
              productId: it.productId?.startsWith("prod-")
                ? undefined
                : it.productId,
              productName: it.name,
              price: it.price,
              quantity: it.quantity,
              subtotal: it.subtotal,
              notes: it.notes,
            })),
          })),
        }),
      }).catch(console.warn);
    }

    setSyncQueue((prev) =>
      prev.map((item) => ({
        ...item,
        syncStatus: "SYNCED",
        syncedAt: item.syncedAt || timeStr,
      })),
    );

    setOrders((prev) =>
      prev.map((ord) => ({
        ...ord,
        syncStatus: "SYNCED",
      })),
    );
  };

  const pendingSyncCount = syncQueue.filter(
    (i) => i.syncStatus === "PENDING_SYNC",
  ).length;

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
        onLockScreen={() => setIsPinLockOpen(true)}
        isOwner={session.user.role === "admin"}
      />

      {/* Main View Area (Right side) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TopBar (Reference Image 3: Welcome + Name, Notification Bell, User Avatar) */}
        <TopBar
          userName={activeStaff.name}
          roleLabel={activeStaff.roleLabel}
          unreadNotifCount={2}
          onOpenNotifications={() => switchTab("notifications")}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          extraActions={
            <div className="flex items-center gap-2">
              {/* Active Branch Badge / Switcher */}
              {isOwner ? (
                <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green-900/10 text-brand-green-950 font-bold text-xs border border-brand-green-900/15">
                  <Store className="size-3 text-brand-green-800" />
                  <select
                    value={currentBranchId}
                    onChange={(e) => handleSwitchBranch(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold text-brand-green-950 outline-none cursor-pointer pr-1"
                    title="Pilih Cabang Aktif untuk Simulasi Transaksi"
                  >
                    {INITIAL_BRANCHES.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green-900/10 text-brand-green-950 font-bold text-xs border border-brand-green-900/15">
                  <Store className="size-3 text-brand-green-800" />
                  <span>{activeBranch.name}</span>
                </div>
              )}

              {/* Quick Lock PIN Button */}
              <button
                type="button"
                onClick={() => setIsPinLockOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold text-xs transition-colors cursor-pointer"
                title="Kunci Layar Kasir / Ganti Shift Cepat via PIN"
              >
                <Lock className="size-3 text-amber-700" />
                <span>Kunci PIN</span>
              </button>

              {/* Laci Cabang status pill */}
              <button
                type="button"
                onClick={() => switchTab("shift")}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-cream-100 hover:bg-brand-cream-200 text-brand-green-900 font-semibold text-xs transition-colors cursor-pointer"
                title="Buka Rekap Kas Cabang"
              >
                <Clock className="size-3 text-brand-green-800" />
                <span>
                  {shift.status === "OPEN" ? "Laci Buka" : "Laci Tutup"}
                </span>
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
                    <span className="hidden sm:inline text-[11px]">
                      {pendingSyncCount} Antrean
                    </span>
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
              products={products}
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
              branchName={activeBranch.name}
              branchCode={activeBranch.branchCode || activeBranch.code}
              onOpenShift={handleOpenShift}
              onCloseShift={handleCloseShift}
            />
          )}

          {activeTab === "sync" && (
            <PosSyncView
              isOnline={effectiveIsOnline}
              syncQueue={syncQueue}
              onForceSync={handleForceSync}
              onToggleSimulateOffline={() =>
                setIsSimulatedOffline(!isSimulatedOffline)
              }
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

      {/* Fast Cashier PIN Screen Lock Modal */}
      <PosPinLockModal
        isOpen={isPinLockOpen}
        staff={activeStaff}
        canDismiss={true}
        onClose={() => setIsPinLockOpen(false)}
        onSuccessUnlock={() => {
          setIsPinLockOpen(false);
        }}
      />
    </div>
  );
}
