import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { siteConfig } from "@/config/site";
import type {
  AdminTab,
  AdminProduct,
  StockLog,
  StockMutationReason,
  StaffAccount,
  OutletSettings,
  ShiftRecord,
  ExpenseRecord,
  AuditLogRecord,
  PromoVoucher,
  RawMaterial,
  ProductRecipe,
} from "@/components/admin/types";
import {
  INITIAL_ADMIN_PRODUCTS,
  INITIAL_STOCK_LOGS,
  INITIAL_STAFF_ACCOUNTS,
  INITIAL_OUTLET_SETTINGS,
  INITIAL_SHIFTS,
  INITIAL_EXPENSES,
  INITIAL_AUDIT_LOGS,
  INITIAL_PROMOS,
  INITIAL_RAW_MATERIALS,
  INITIAL_PRODUCT_RECIPES,
} from "@/components/admin/mock-data";
import { INITIAL_ORDERS } from "@/components/pos/mock-data";
import type { CompletedOrder } from "@/components/pos/types";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminAnalyticsView } from "@/components/admin/admin-analytics-view";
import { AdminProductsView } from "@/components/admin/admin-products-view";
import { AdminInventoryView } from "@/components/admin/admin-inventory-view";
import { AdminTransactionsView } from "@/components/admin/admin-transactions-view";
import { AdminShiftsView } from "@/components/admin/admin-shifts-view";
import { AdminExpensesView } from "@/components/admin/admin-expenses-view";
import { AdminAuditLogsView } from "@/components/admin/admin-audit-logs-view";
import { AdminSettingsView } from "@/components/admin/admin-settings-view";
import { AdminPromosView } from "@/components/admin/admin-promos-view";
import { AdminRecipesView } from "@/components/admin/admin-recipes-view";
import { TopBar } from "@/components/common/top-bar";
import { NotificationsView } from "@/components/common/notifications-view";
import { Store } from "lucide-react";

export const Route = createFileRoute("/_protected/admin")({
  head: () => ({ meta: [{ title: `Dashboard Owner & Admin | ${siteConfig.name}` }] }),
  component: AdminDashboardPage,
});

export function AdminDashboardPage() {
  const { session } = Route.useRouteContext();
  const ownerName = session.user.name || "Ahmad Fauzi (Owner)";

  // Sidebar Collapse & Mobile Drawer States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Active Tab state with URL parameter sync
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (
        tabParam &&
        [
          "analytics",
          "products",
          "inventory",
          "transactions",
          "shifts",
          "expenses",
          "promos",
          "recipes",
          "audit-logs",
          "settings",
          "notifications",
        ].includes(tabParam)
      ) {
        return tabParam as AdminTab;
      }
    }
    return "analytics";
  });

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    setIsMobileSidebarOpen(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  };

  // Shared Data States
  const [products, setProducts] = useState<AdminProduct[]>(INITIAL_ADMIN_PRODUCTS);
  const [stockLogs, setStockLogs] = useState<StockLog[]>(INITIAL_STOCK_LOGS);
  const [orders, setOrders] = useState<CompletedOrder[]>(INITIAL_ORDERS);
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>(INITIAL_STAFF_ACCOUNTS);
  const [settings, setSettings] = useState<OutletSettings>(INITIAL_OUTLET_SETTINGS);
  const [shifts, setShifts] = useState<ShiftRecord[]>(INITIAL_SHIFTS);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(INITIAL_EXPENSES);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>(INITIAL_AUDIT_LOGS);
  const [promos, setPromos] = useState<PromoVoucher[]>(INITIAL_PROMOS);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(INITIAL_RAW_MATERIALS);
  const [recipes, setRecipes] = useState<ProductRecipe[]>(INITIAL_PRODUCT_RECIPES);

  // Counts for Badges
  const lowStockCount = products.filter(
    (p) => p.trackStock && p.currentStock <= p.lowStockThreshold
  ).length;

  // Product Actions
  const handleAddProduct = (newProd: Omit<AdminProduct, "id" | "soldCount">) => {
    const id = `prod-${Date.now()}`;
    const product: AdminProduct = {
      ...newProd,
      id,
      soldCount: 0,
    };
    setProducts((prev) => [product, ...prev]);

    // Record initial restock log if tracking stock
    if (newProd.trackStock && newProd.currentStock > 0) {
      const log: StockLog = {
        id: `log-${Date.now()}`,
        productId: id,
        productName: newProd.name,
        quantityChange: newProd.currentStock,
        finalStock: newProd.currentStock,
        reason: "RESTOCK",
        reasonLabel: "Restock Bahan Masuk",
        notes: "Stok awal pembukaan menu baru",
        staffName: ownerName,
        timestamp: `${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
      };
      setStockLogs((prev) => [log, ...prev]);
    }
  };

  const handleUpdateProduct = (id: string, updates: Partial<AdminProduct>) => {
    const oldProduct = products.find((p) => p.id === id);

    // If price changed, log to audit trail
    if (oldProduct && updates.price !== undefined && oldProduct.price !== updates.price) {
      const audit: AuditLogRecord = {
        id: `audit-${Date.now()}`,
        timestamp: `${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}, ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
        date: "24 Sep 2026",
        time: `${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
        action: "MENU_PRICE_CHANGE",
        actionLabel: "Perubahan Harga Menu",
        entityType: "PRODUCT",
        entityId: id,
        performedBy: ownerName,
        userRole: "owner",
        details: {
          title: `Penyesuaian Harga Menu ${updates.name || oldProduct.name}`,
          before: `Rp ${oldProduct.price.toLocaleString("id-ID")}`,
          after: `Rp ${updates.price.toLocaleString("id-ID")}`,
          reason: "Penyesuaian harga jual oleh owner",
        },
      };
      setAuditLogs((prev) => [audit, ...prev]);
    }

    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const handleToggleProductAvailability = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isAvailable: !p.isAvailable } : p))
    );
  };

  // Stock Mutation Action
  const handleMutateStock = (
    productId: string,
    delta: number,
    reason: StockMutationReason,
    notes: string,
    staff: string
  ) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    const newStock = Math.max(0, target.currentStock + delta);

    // Update product stock
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, currentStock: newStock } : p))
    );

    // Add log
    const log: StockLog = {
      id: `log-${Date.now()}`,
      productId,
      productName: target.name,
      quantityChange: delta,
      finalStock: newStock,
      reason,
      reasonLabel:
        reason === "RESTOCK"
          ? "Restock Bahan Masuk"
          : reason === "SPOILAGE"
            ? "Bahan Rusak / Basi"
            : "Penyesuaian Opname",
      notes,
      staffName: staff,
      timestamp: `${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
    };

    setStockLogs((prev) => [log, ...prev]);
  };

  // Transaction Void Action
  const handleVoidOrder = (orderId: string, reason: string) => {
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              status: "VOID",
              voidReason: reason,
              voidedAt: `${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
            }
          : ord
      )
    );

    // Add audit log
    const audit: AuditLogRecord = {
      id: `audit-${Date.now()}`,
      timestamp: `${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}, ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
      date: "24 Sep 2026",
      time: `${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
      action: "VOID_ORDER",
      actionLabel: "Otorisasi Void Transaksi",
      entityType: "ORDER",
      entityId: orderId,
      performedBy: ownerName,
      userRole: "owner",
      details: {
        title: `Pembatalan Transaksi Nota #${orderId}`,
        before: "Status: PAID",
        after: "Status: VOID (Pengembalian Dana Kasir)",
        reason: reason,
      },
    };
    setAuditLogs((prev) => [audit, ...prev]);
  };

  // Shift Verification Action
  const handleVerifyShift = (shiftId: string) => {
    setShifts((prev) =>
      prev.map((s) => (s.id === shiftId ? { ...s, verifiedByOwner: true } : s))
    );
    const target = shifts.find((s) => s.id === shiftId);
    const log: AuditLogRecord = {
      id: `audit-${Date.now()}`,
      timestamp: `${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}, ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
      date: "24 Sep 2026",
      time: `${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
      action: "SHIFT_FORCE_CLOSE",
      actionLabel: "Verifikasi Tutup Shift",
      entityType: "SHIFT",
      entityId: shiftId,
      performedBy: ownerName,
      userRole: "owner",
      details: {
        title: `Verifikasi & Approval Rekonsiliasi ${target ? target.shiftName : shiftId}`,
        before: "Status: Belum Terverifikasi",
        after: "Status: Terverifikasi Owner",
        reason: "Owner telah memeriksa dan menyetujui setoran kas fisik shift",
      },
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  // Expense Action
  const handleAddExpense = (newExp: Omit<ExpenseRecord, "id">) => {
    const id = `exp-${Date.now()}`;
    const expense: ExpenseRecord = { ...newExp, id };
    setExpenses((prev) => [expense, ...prev]);

    const log: AuditLogRecord = {
      id: `audit-${Date.now()}`,
      timestamp: `${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}, ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
      date: newExp.date,
      time: newExp.time,
      action: "EXPENSE_RECORDED",
      actionLabel: "Pencatatan Biaya Kas Kecil",
      entityType: "EXPENSE",
      entityId: id,
      performedBy: newExp.staffName,
      userRole: newExp.sourceOfFund === "TRANSFER_OWNER" ? "owner" : "cashier",
      details: {
        title: `Pengeluaran ${newExp.categoryLabel}: Rp ${newExp.amount.toLocaleString("id-ID")}`,
        before: "Pengeluaran Belum Tercatat",
        after: `Tercatat: ${newExp.description}`,
        reason: newExp.notes || "Belanja operasional harian outlet",
      },
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  // Staff Account Actions
  const handleAddStaff = (newStaff: Omit<StaffAccount, "id" | "lastLogin">) => {
    const staff: StaffAccount = {
      ...newStaff,
      id: `staff-${Date.now()}`,
      lastLogin: "Belum pernah login",
    };
    setStaffAccounts((prev) => [...prev, staff]);
  };

  const handleUpdateStaffPin = (staffId: string, newPin: string) => {
    const target = staffAccounts.find((s) => s.id === staffId);
    setStaffAccounts((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, pin: newPin } : s))
    );

    if (target) {
      const log: AuditLogRecord = {
        id: `audit-${Date.now()}`,
        timestamp: `${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}, ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
        date: "24 Sep 2026",
        time: `${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
        action: "STAFF_PIN_RESET",
        actionLabel: "Reset PIN Staf Kasir",
        entityType: "STAFF",
        entityId: staffId,
        performedBy: ownerName,
        userRole: "owner",
        details: {
          title: `Reset PIN Login Cepat Akun ${target.name}`,
          before: "PIN Lama Aktif",
          after: "PIN Baru Aktif (****)",
          reason: "Rotasi keamanan berkala akses kasir outlet",
        },
      };
      setAuditLogs((prev) => [log, ...prev]);
    }
  };

  const handleToggleStaffStatus = (staffId: string) => {
    setStaffAccounts((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, isActive: !s.isActive } : s))
    );
  };

  // Promo Handlers (PRD Fase 2)
  const handleAddPromo = (newPromoData: Omit<PromoVoucher, "id" | "usedCount">) => {
    const newPromo: PromoVoucher = {
      ...newPromoData,
      id: `promo-${Date.now()}`,
      usedCount: 0,
    };
    setPromos((prev) => [newPromo, ...prev]);

    const log: AuditLogRecord = {
      id: `audit-${Date.now()}`,
      timestamp: `${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}, ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
      date: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
      time: `${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
      action: "PROMO_CREATED",
      actionLabel: "Pembuatan Promo Baru",
      entityType: "PROMO",
      entityId: newPromo.id,
      performedBy: ownerName,
      userRole: "owner",
      details: {
        title: `Kupon Baru: ${newPromo.code} (${newPromo.name})`,
        after: `Diskon: ${newPromo.discountType === "PERCENTAGE" ? `${newPromo.discountValue}%` : `Rp ${newPromo.discountValue.toLocaleString("id-ID")}`}, Min. Belanja: Rp ${newPromo.minOrderAmount.toLocaleString("id-ID")}`,
        reason: "Peluncuran kampanye promo baru outlet",
      },
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  const handleUpdatePromo = (id: string, updates: Partial<PromoVoucher>) => {
    setPromos((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));

    const log: AuditLogRecord = {
      id: `audit-${Date.now()}`,
      timestamp: `${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}, ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
      date: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
      time: `${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
      action: "PROMO_UPDATED",
      actionLabel: "Pembaruan Pengaturan Promo",
      entityType: "PROMO",
      entityId: id,
      performedBy: ownerName,
      userRole: "owner",
      details: {
        title: `Pembaruan Voucher Promo ID ${id}`,
        reason: "Penyesuaian kuota atau batas masa berlaku promo",
      },
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  const handleDeletePromo = (id: string) => {
    setPromos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleTogglePromoStatus = (id: string, currentStatus: boolean) => {
    setPromos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !currentStatus } : p))
    );
  };

  // Recipe & Raw Materials Handlers (PRD Fase 2)
  const handleUpdateRecipe = (
    productId: string,
    updatedIngredients: ProductRecipe["ingredients"],
    notes?: string
  ) => {
    const newTotalHpp = updatedIngredients.reduce((s, i) => s + i.subtotalCost, 0);

    setRecipes((prev) =>
      prev.map((r) => {
        if (r.productId === productId) {
          const grossMarginAmount = r.sellingPrice - newTotalHpp;
          const grossMarginPercent =
            Math.round(((r.sellingPrice - newTotalHpp) / r.sellingPrice) * 1000) / 10;
          return {
            ...r,
            ingredients: updatedIngredients,
            totalHpp: newTotalHpp,
            grossMarginAmount,
            grossMarginPercent,
            notes: notes || r.notes,
          };
        }
        return r;
      })
    );

    // Sync product costPrice (HPP) in menu catalog
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, costPrice: newTotalHpp } : p))
    );

    const targetRecipe = recipes.find((r) => r.productId === productId);
    const log: AuditLogRecord = {
      id: `audit-${Date.now()}`,
      timestamp: `${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}, ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
      date: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
      time: `${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
      action: "RECIPE_UPDATED",
      actionLabel: "Penyesuaian Komposisi Resep (BOM)",
      entityType: "RECIPE",
      entityId: productId,
      performedBy: ownerName,
      userRole: "owner",
      details: {
        title: `Update Resep Menu: ${targetRecipe?.productName || productId}`,
        before: `HPP Lama: Rp ${targetRecipe?.totalHpp.toLocaleString("id-ID") || 0}`,
        after: `HPP Baru: Rp ${newTotalHpp.toLocaleString("id-ID")}`,
        reason: "Penyesuaian takaran gramatur bahan baku per porsi",
      },
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  const handleRestockMaterial = (
    materialId: string,
    addedStock: number,
    newCostPerUnit?: number,
    notes?: string
  ) => {
    setRawMaterials((prev) =>
      prev.map((m) => {
        if (m.id === materialId) {
          const updatedStock = m.currentStock + addedStock;
          const updatedCost = newCostPerUnit && newCostPerUnit > 0 ? newCostPerUnit : m.costPerUnit;
          return {
            ...m,
            currentStock: updatedStock,
            costPerUnit: updatedCost,
            lastRestockDate: "Hari ini",
          };
        }
        return m;
      })
    );

    const mat = rawMaterials.find((m) => m.id === materialId);
    const log: AuditLogRecord = {
      id: `audit-${Date.now()}`,
      timestamp: `${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}, ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
      date: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
      time: `${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
      action: "RAW_MATERIAL_RESTOCKED",
      actionLabel: "Restock Bahan Mentah Gudang",
      entityType: "RAW_MATERIAL",
      entityId: materialId,
      performedBy: ownerName,
      userRole: "owner",
      details: {
        title: `Restock Masuk: ${mat?.name || materialId} +${addedStock.toLocaleString("id-ID")} ${mat?.unit || "unit"}`,
        reason: notes || "Belanja bahan baku rutin dapur",
      },
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  const handleAddNewMaterial = (newMatData: Omit<RawMaterial, "id">) => {
    const newMaterial: RawMaterial = {
      ...newMatData,
      id: `rm-${Date.now()}`,
    };
    setRawMaterials((prev) => [newMaterial, ...prev]);
  };

  return (
    <div className="flex-1 flex h-screen w-screen overflow-hidden bg-brand-cream-50/50">
      {/* Collapsible Sidebar (Left side, full height) */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        productCount={products.length}
        lowStockCount={lowStockCount}
        unreadNotifCount={lowStockCount > 0 ? lowStockCount + 1 : 2}
        ownerName={ownerName}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main View Area (Right side) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TopBar */}
        <TopBar
          userName={ownerName}
          roleLabel="Business Owner"
          unreadNotifCount={lowStockCount > 0 ? lowStockCount + 1 : 2}
          onOpenNotifications={() => handleTabChange("notifications")}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          extraActions={
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-brand-green-900 bg-brand-cream-100 px-3 py-1.5 rounded-full border border-brand-green-900/10">
              <Store className="size-3.5 text-brand-green-800" />
              <span>{settings.branchCode}</span>
            </div>
          }
        />

        {/* Main Content Scroll Area */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === "analytics" && (
            <AdminAnalyticsView orders={orders} products={products} expenses={expenses} />
          )}

          {activeTab === "products" && (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-12">
              <AdminProductsView
                products={products}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onToggleAvailability={handleToggleProductAvailability}
              />
            </div>
          )}

          {activeTab === "inventory" && (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-12">
              <AdminInventoryView
                products={products}
                stockLogs={stockLogs}
                onMutateStock={handleMutateStock}
              />
            </div>
          )}

          {activeTab === "transactions" && (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-12">
              <AdminTransactionsView orders={orders} onVoidOrder={handleVoidOrder} />
            </div>
          )}

          {activeTab === "shifts" && (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-12">
              <AdminShiftsView shifts={shifts} onVerifyShift={handleVerifyShift} />
            </div>
          )}

          {activeTab === "expenses" && (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-12">
              <AdminExpensesView expenses={expenses} onAddExpense={handleAddExpense} />
            </div>
          )}

          {activeTab === "promos" && (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-12">
              <AdminPromosView
                promos={promos}
                onAddPromo={handleAddPromo}
                onUpdatePromo={handleUpdatePromo}
                onDeletePromo={handleDeletePromo}
                onTogglePromoStatus={handleTogglePromoStatus}
              />
            </div>
          )}

          {activeTab === "recipes" && (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-12">
              <AdminRecipesView
                recipes={recipes}
                rawMaterials={rawMaterials}
                onUpdateRecipe={handleUpdateRecipe}
                onRestockMaterial={handleRestockMaterial}
                onAddNewMaterial={handleAddNewMaterial}
              />
            </div>
          )}

          {activeTab === "audit-logs" && (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-12">
              <AdminAuditLogsView auditLogs={auditLogs} />
            </div>
          )}

          {activeTab === "settings" && (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-12">
              <AdminSettingsView
                settings={settings}
                staffAccounts={staffAccounts}
                onUpdateSettings={setSettings}
                onAddStaff={handleAddStaff}
                onUpdateStaffPin={handleUpdateStaffPin}
                onToggleStaffStatus={handleToggleStaffStatus}
              />
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-12">
              <NotificationsView
                onNavigateTab={(tab) => handleTabChange(tab as AdminTab)}
                onClose={() => handleTabChange("analytics")}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
