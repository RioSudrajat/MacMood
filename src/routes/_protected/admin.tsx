import { useEffect, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
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
  RawMaterialCategory,
  RawMaterialUnit,
  ProductRecipe,
  BranchOutlet,
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
  INITIAL_BRANCHES,
} from "@/components/admin/mock-data";
import { INITIAL_ORDERS } from "@/components/pos/mock-data";
import type { CompletedOrder } from "@/components/pos/types";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminPosAccessModal } from "@/components/admin/admin-pos-access-modal";
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
  beforeLoad: ({ context }) => {
    // RBAC: Hanya akun dengan role admin / owner yang diizinkan mengakses Admin Suite
    if (context.session?.user?.role !== "admin") {
      throw redirect({ to: "/app" });
    }
  },
  head: () => ({
    meta: [{ title: `Dashboard Owner & Admin | ${siteConfig.name}` }],
  }),
  component: AdminDashboardPage,
});

export function AdminDashboardPage() {
  const { session } = Route.useRouteContext();
  const ownerName = session.user.name || "Muhammad Afrizal";

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
  const [products, setProducts] = useState<AdminProduct[]>(
    INITIAL_ADMIN_PRODUCTS,
  );
  const [stockLogs, setStockLogs] = useState<StockLog[]>(INITIAL_STOCK_LOGS);
  const [orders, setOrders] = useState<CompletedOrder[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("macmood_offline_orders");
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn("Failed to load cached orders in admin:", e);
      }
    }
    return INITIAL_ORDERS;
  });
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>(
    INITIAL_STAFF_ACCOUNTS,
  );
  const [settings, setSettings] = useState<OutletSettings>(
    INITIAL_OUTLET_SETTINGS,
  );
  const [shifts, setShifts] = useState<ShiftRecord[]>(INITIAL_SHIFTS);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(INITIAL_EXPENSES);
  const [auditLogs, setAuditLogs] =
    useState<AuditLogRecord[]>(INITIAL_AUDIT_LOGS);
  const [promos, setPromos] = useState<PromoVoucher[]>(INITIAL_PROMOS);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(
    INITIAL_RAW_MATERIALS,
  );
  const [recipes, setRecipes] = useState<ProductRecipe[]>(
    INITIAL_PRODUCT_RECIPES,
  );
  const [branches, setBranches] = useState<BranchOutlet[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("macmood_branches");
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn("Failed to load cached branches:", e);
      }
    }
    return INITIAL_BRANCHES;
  });
  const [isPosAccessModalOpen, setIsPosAccessModalOpen] = useState(false);

  // Load live data from PostgreSQL Backend
  useEffect(() => {
    let isMounted = true;
    async function loadAdminData() {
      try {
        const [
          prodRes,
          orderRes,
          shiftRes,
          expRes,
          promoRes,
          matRes,
          recipeRes,
          auditRes,
          branchRes,
        ] = await Promise.allSettled([
          fetch("/api/catalog/products").then((r) => r.json()),
          fetch("/api/pos/orders?limit=50").then((r) => r.json()),
          fetch("/api/pos/shifts").then((r) => r.json()),
          fetch("/api/expenses").then((r) => r.json()),
          fetch("/api/promos").then((r) => r.json()),
          fetch("/api/inventory/materials").then((r) => r.json()),
          fetch("/api/inventory/recipes").then((r) => r.json()),
          fetch("/api/audit-logs").then((r) => r.json()),
          fetch("/api/branches").then((r) => r.json()),
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
                costPrice?: number;
                currentStock: number;
                trackStock: boolean;
                isAvailable: boolean;
                imageUrl?: string;
                soldCount?: number;
                branchSoldCounts?: Record<string, number>;
                branchStocks?: Record<string, number>;
              }>
            ).map((p) => {
              const category: "mac" | "sides" | "drinks" =
                p.categorySlug === "sides" || p.categorySlug === "drinks"
                  ? p.categorySlug
                  : "mac";
              const catLabels = {
                mac: "Macaroni",
                sides: "Sides & Snack",
                drinks: "Minuman",
              };
              return {
                id: p.id,
                name: p.name,
                category,
                categoryLabel: catLabels[category],
                price: p.price,
                costPrice: p.costPrice || Math.round(p.price * 0.45),
                description: "",
                image: p.imageUrl || "/assets/menu-super-mac-reference.png",
                currentStock: p.currentStock,
                lowStockThreshold: 10,
                trackStock: p.trackStock,
                isAvailable: p.isAvailable,
                soldCount: p.soldCount ?? 0,
                branchSoldCounts: p.branchSoldCounts || {},
                branchStocks: p.branchStocks,
              };
            }),
          );
        }

        if (
          orderRes.status === "fulfilled" &&
          orderRes.value?.data?.length > 0
        ) {
          const backendOrders = (
            orderRes.value.data as Array<{
              id: string;
              orderNumber: string;
              branchId?: string;
              branchName?: string;
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
              paymentMethod: CompletedOrder["paymentMethod"];
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
            branchId:
              o.branchId ||
              (o.cashierName?.includes("Tebet")
                ? "branch-3"
                : o.cashierName?.includes("Margonda")
                  ? "branch-2"
                  : "branch-1"),
            branchName:
              o.branchName ||
              (o.cashierName?.includes("Tebet")
                ? "MacMood Kitchen - Tebet"
                : o.cashierName?.includes("Margonda")
                  ? "MacMood Express - Margonda"
                  : "MacMood Pusat - Fatmawati"),
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
              : o.paymentStatus || "PAID") as CompletedOrder["status"],
          }));
          setOrders(backendOrders);

          // Sync soldCounts from loaded orders
          const orderSoldMap = new Map<
            string,
            { total: number; byBranch: Record<string, number> }
          >();
          for (const o of backendOrders) {
            if (o.status !== "VOID") {
              for (const it of o.items) {
                const key = it.name;
                const cur = orderSoldMap.get(key) || { total: 0, byBranch: {} };
                cur.total += it.quantity;
                if (o.branchId) {
                  cur.byBranch[o.branchId] =
                    (cur.byBranch[o.branchId] || 0) + it.quantity;
                }
                orderSoldMap.set(key, cur);
              }
            }
          }

          setProducts((prev) =>
            prev.map((p) => {
              const fromOrders = orderSoldMap.get(p.name);
              return {
                ...p,
                soldCount: fromOrders ? fromOrders.total : p.soldCount,
                branchSoldCounts: fromOrders
                  ? fromOrders.byBranch
                  : p.branchSoldCounts,
              };
            }),
          );
        }

        if (shiftRes.status === "fulfilled") {
          const val = shiftRes.value as {
            active?: {
              id: string;
              staffName: string;
              shiftCode: string;
              startTime: string;
              endTime?: string;
              initialCash: number;
              cashSales: number;
              qrisSales: number;
              totalOrders: number;
              expectedCash: number;
              actualCash?: number;
              cashDifference?: number;
              status: "OPEN" | "CLOSED";
              isVerified?: boolean;
              notes?: string;
            };
            past?: Array<{
              id: string;
              staffName: string;
              shiftCode: string;
              startTime: string;
              endTime?: string;
              initialCash: number;
              cashSales: number;
              qrisSales: number;
              totalOrders: number;
              expectedCash: number;
              actualCash?: number;
              cashDifference?: number;
              status: "OPEN" | "CLOSED";
              isVerified?: boolean;
              notes?: string;
            }>;
          };
          const shiftMap = new Map<
            string,
            {
              id: string;
              staffName: string;
              shiftCode: string;
              startTime: string;
              endTime?: string;
              initialCash: number;
              cashSales: number;
              qrisSales: number;
              totalOrders: number;
              expectedCash: number;
              actualCash?: number;
              cashDifference?: number;
              status: "OPEN" | "CLOSED";
              isVerified?: boolean;
              notes?: string;
            }
          >();

          if (val.active) shiftMap.set(val.active.id, val.active);
          if (val.past && Array.isArray(val.past)) {
            val.past.forEach((s) => {
              if (!shiftMap.has(s.id)) shiftMap.set(s.id, s);
            });
          }

          const shiftList = Array.from(shiftMap.values());

          if (shiftList.length > 0) {
            const mappedBackendShifts: ShiftRecord[] = shiftList.map((s) => {
              let branchId = "branch-1";
              let branchName = "MacMood Pusat - Fatmawati";
              let branchCode = "MAC-JKT-01";

              const nameLower = (s.staffName || "").toLowerCase();
              if (
                nameLower.includes("margonda") ||
                nameLower.includes("rian") ||
                nameLower.includes("outlet 2")
              ) {
                branchId = "branch-2";
                branchName = "MacMood Express - Margonda";
                branchCode = "MAC-DPK-01";
              } else if (
                nameLower.includes("tebet") ||
                nameLower.includes("siti") ||
                nameLower.includes("outlet 3")
              ) {
                branchId = "branch-3";
                branchName = "MacMood Kitchen - Tebet";
                branchCode = "MAC-JKT-02";
              }

              return {
                id: s.id,
                shiftName: `Rekap Harian · ${branchName.replace("MacMood ", "")}`,
                branchId,
                branchName,
                branchCode,
                cashierId: s.staffName,
                cashierName: s.staffName,
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
                  : null,
                date: new Date(s.startTime).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }),
                initialCash: s.initialCash,
                cashSales: s.cashSales,
                qrisSales: s.qrisSales,
                totalOrders: s.totalOrders,
                expectedCash: s.expectedCash,
                actualCash: s.actualCash || s.expectedCash,
                cashDifference: s.cashDifference || 0,
                status: s.status as "OPEN" | "CLOSED",
                notes: s.notes || "",
                verifiedByOwner: s.isVerified || false,
              };
            });

            setShifts(mappedBackendShifts);
          }
        }

        if (expRes.status === "fulfilled" && expRes.value?.data?.length > 0) {
          const expCategoryLabels: Record<ExpenseRecord["category"], string> = {
            BAHAN_BAKU: "Bahan Baku Tambahan",
            UTILITAS_GAS: "Gas & Utilitas Dapur",
            KEMASAN: "Packaging & Plastik",
            KEBERSIHAN: "Kebersihan & Sanitasi",
            OPERASIONAL_LAIN: "Operasional Lain-lain",
          };
          setExpenses(
            (
              expRes.value.data as Array<{
                id: string;
                createdAt: string;
                title: string;
                amount: number;
                category: ExpenseRecord["category"];
                paymentSource: "CASH_DRAWER" | "BANK_TRANSFER";
                staffName: string;
                receiptNumber?: string;
                notes?: string;
              }>
            ).map((e) => ({
              id: e.id,
              date: new Date(e.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
              time:
                new Date(e.createdAt).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                }) + " WIB",
              category: e.category,
              categoryLabel: expCategoryLabels[e.category] || "Pengeluaran",
              description: e.title,
              amount: e.amount,
              sourceOfFund:
                e.paymentSource === "CASH_DRAWER"
                  ? ("KAS_LACI" as const)
                  : ("TRANSFER_OWNER" as const),
              staffName: e.staffName,
              receiptNumber: e.receiptNumber || undefined,
              notes: e.notes || "",
            })),
          );
        }

        if (
          promoRes.status === "fulfilled" &&
          promoRes.value?.data?.length > 0
        ) {
          setPromos(
            (
              promoRes.value.data as Array<{
                id: string;
                code: string;
                name: string;
                description?: string;
                discountType: "PERCENTAGE" | "FIXED";
                discountValue: number;
                maxDiscount?: number;
                minSubtotal?: number;
                maxUsage?: number;
                currentUsage?: number;
                isActive: boolean;
                startDate: string;
                endDate?: string;
              }>
            ).map((p) => ({
              id: p.id,
              code: p.code,
              name: p.name,
              description: p.description || "",
              discountType:
                p.discountType === "FIXED" ? "FIXED_AMOUNT" : "PERCENTAGE",
              discountValue: p.discountValue,
              maxDiscount: p.maxDiscount || undefined,
              minOrderAmount: p.minSubtotal || 0,
              quota: p.maxUsage || 9999,
              usedCount: p.currentUsage || 0,
              isActive: p.isActive,
              startDate: new Date(p.startDate).toISOString().slice(0, 10),
              endDate: p.endDate
                ? new Date(p.endDate).toISOString().slice(0, 10)
                : "2026-12-31",
            })),
          );
        }

        if (matRes.status === "fulfilled" && matRes.value?.data?.length > 0) {
          setRawMaterials(
            (
              matRes.value.data as Array<{
                id: string;
                name: string;
                sku: string;
                category: RawMaterialCategory;
                unit: RawMaterialUnit;
                currentStock: string | number;
                minStock: string | number;
                costPerUnit: number;
                supplierName?: string;
                updatedAt: string;
              }>
            ).map((m) => {
              const catLabels: Record<RawMaterialCategory, string> = {
                PASTA: "Pasta Kering",
                DAIRY_CHEESE: "Keju & Olahan Susu",
                PROTEIN: "Daging & Protein",
                SEASONING: "Bumbu & Rempah",
                PACKAGING: "Kemasan & Packaging",
              };
              return {
                id: m.id,
                code: m.sku,
                name: m.name,
                category: m.category,
                categoryLabel: catLabels[m.category] || "Bahan Baku",
                unit: m.unit,
                currentStock: Number(m.currentStock),
                minThreshold: Number(m.minStock),
                costPerUnit: m.costPerUnit,
                supplier: m.supplierName || "-",
                lastRestockDate: new Date(m.updatedAt)
                  .toISOString()
                  .slice(0, 10),
              };
            }),
          );
        }

        if (
          recipeRes.status === "fulfilled" &&
          recipeRes.value?.data?.length > 0
        ) {
          setRecipes(
            (
              recipeRes.value.data as Array<{
                productId: string;
                productName: string;
                categorySlug: string;
                price: number;
                calculatedHpp: number;
                grossMargin: number;
                availablePortions: number;
                limitingIngredient?: string;
                ingredients?: Array<{
                  rawMaterialId: string;
                  materialName: string;
                  amount: number;
                  unit: string;
                  costSubtotal: number;
                }>;
              }>
            ).map((r) => {
              const category: "mac" | "sides" | "drinks" =
                r.categorySlug === "sides" || r.categorySlug === "drinks"
                  ? r.categorySlug
                  : "mac";
              return {
                productId: r.productId,
                productName: r.productName,
                category,
                sellingPrice: r.price,
                totalHpp: r.calculatedHpp,
                grossMarginAmount: r.price - r.calculatedHpp,
                grossMarginPercent: r.grossMargin,
                maxPortionsAvailable: r.availablePortions,
                limitingMaterialName:
                  r.limitingIngredient || "Bahan Baku Cukup",
                ingredients: (r.ingredients || []).map((it) => ({
                  materialId: it.rawMaterialId,
                  materialName: it.materialName,
                  amount: it.amount,
                  unit: (it.unit as RawMaterialUnit) || "gram",
                  costPerUnit: Math.round(it.costSubtotal / (it.amount || 1)),
                  subtotalCost: it.costSubtotal,
                })),
              };
            }),
          );
        }

        if (
          auditRes.status === "fulfilled" &&
          auditRes.value?.data?.length > 0
        ) {
          setAuditLogs(
            (
              auditRes.value.data as Array<{
                id: string;
                createdAt: string;
                action: AuditLogRecord["action"];
                actionLabel: string;
                entityType: string;
                entityId?: string;
                userName: string;
                userRole: string;
                oldValue?: string;
                newValue?: string;
                reason?: string;
              }>
            ).map((a) => {
              const validEntityTypes: AuditLogRecord["entityType"][] = [
                "PRODUCT",
                "ORDER",
                "STAFF",
                "SHIFT",
                "SETTING",
                "EXPENSE",
                "STOCK",
                "PROMO",
                "RECIPE",
                "RAW_MATERIAL",
              ];
              const entityType = validEntityTypes.includes(
                a.entityType as AuditLogRecord["entityType"],
              )
                ? (a.entityType as AuditLogRecord["entityType"])
                : "PRODUCT";
              return {
                id: a.id,
                timestamp: `${new Date(a.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}, ${new Date(a.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
                date: new Date(a.createdAt).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }),
                time:
                  new Date(a.createdAt).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }) + " WIB",
                action: a.action,
                actionLabel: a.actionLabel,
                entityType,
                entityId: a.entityId || "",
                performedBy: a.userName,
                userRole: ((a.userRole?.toLowerCase() === "owner" ||
                  a.userName.toLowerCase().includes("afrizal")) &&
                !a.userName.toLowerCase().includes("budi") &&
                !a.userName.toLowerCase().includes("rian") &&
                !a.userName.toLowerCase().includes("siti") &&
                !a.userName.toLowerCase().includes("kasir")
                  ? "owner"
                  : "cashier") as "owner" | "cashier",
                details: {
                  title: a.actionLabel,
                  before: a.oldValue || "-",
                  after: a.newValue || "-",
                  reason: a.reason || "-",
                },
              };
            }),
          );
        }

        if (
          branchRes.status === "fulfilled" &&
          branchRes.value?.data?.length > 0
        ) {
          const mappedBranches: BranchOutlet[] = (
            branchRes.value.data as Array<{
              id: string;
              name: string;
              branchCode: string;
              address: string;
              city: string;
              phone: string;
              email?: string;
              pin?: string;
              isActive?: boolean;
              taxRate?: number;
              serviceChargeRate?: number;
              qrisMerchantName?: string;
              qrisNmid?: string;
              bankAccount?: string;
              bankName?: string;
            }>
          ).map((b) => ({
            id: b.id,
            name: b.name,
            branchCode: b.branchCode,
            code: b.branchCode,
            address: b.address,
            city: b.city,
            phone: b.phone,
            email: b.email || `${b.branchCode.toLowerCase()}@macmood.id`,
            pin: b.pin || "1234",
            isActive: b.isActive !== false,
            taxRate: b.taxRate ?? 10,
            serviceChargeRate: b.serviceChargeRate ?? 0,
            qrisMerchantName: b.qrisMerchantName || b.name,
            qrisNmid: b.qrisNmid || "ID1020030040",
            bankAccount: b.bankAccount || "BCA 8830-1928-33",
            bankName: b.bankName || "BCA",
            posCount: 1,
            deviceCount: 1,
          }));
          setBranches(mappedBranches);
        }
      } catch (err) {
        console.warn("Using offline fallback data for admin suite:", err);
      }
    }

    loadAdminData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Counts for Badges
  const lowStockCount = products.filter(
    (p) => p.trackStock && p.currentStock <= p.lowStockThreshold,
  ).length;

  // Product Actions
  const handleAddProduct = (
    newProd: Omit<AdminProduct, "id" | "soldCount">,
  ) => {
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
    if (
      oldProduct &&
      updates.price !== undefined &&
      oldProduct.price !== updates.price
    ) {
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

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );
  };

  const handleToggleProductAvailability = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, isAvailable: !p.isAvailable } : p,
      ),
    );
  };

  // Stock Mutation Action
  const handleMutateStock = (
    productId: string,
    delta: number,
    reason: StockMutationReason,
    notes: string,
    staff: string,
    branchId?: string,
    branchName?: string,
  ) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    const newStock = Math.max(0, target.currentStock + delta);
    const updatedBranchStocks = { ...(target.branchStocks || {}) };
    if (branchId) {
      const curBranchStock =
        updatedBranchStocks[branchId] ?? Math.round(target.currentStock / 3);
      updatedBranchStocks[branchId] = Math.max(0, curBranchStock + delta);
    }

    // Update product stock
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              currentStock: newStock,
              branchStocks: updatedBranchStocks,
            }
          : p,
      ),
    );

    // Add log
    const log: StockLog = {
      id: `log-${Date.now()}`,
      productId,
      productName: target.name,
      quantityChange: delta,
      finalStock: newStock,
      branchId,
      branchName,
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
          : ord,
      ),
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
      prev.map((s) => (s.id === shiftId ? { ...s, verifiedByOwner: true } : s)),
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

    // Push to Backend API
    fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newExp.description,
        amount: newExp.amount,
        category: newExp.category,
        paymentSource:
          newExp.sourceOfFund === "TRANSFER_OWNER"
            ? "OWNER_TRANSFER"
            : "CASH_DRAWER",
        staffName: newExp.staffName,
        receiptNumber: newExp.receiptNumber,
        notes: newExp.notes,
      }),
    }).catch(console.warn);
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
      prev.map((s) => (s.id === staffId ? { ...s, pin: newPin } : s)),
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
      prev.map((s) => (s.id === staffId ? { ...s, isActive: !s.isActive } : s)),
    );
  };

  const handleResetStaffPassword = (staffId: string, newPass: string) => {
    const target = staffAccounts.find((s) => s.id === staffId);
    if (target) {
      const log: AuditLogRecord = {
        id: `audit-${Date.now()}`,
        timestamp: `${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}, ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
        date: "24 Sep 2026",
        time: `${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
        action: "STAFF_PASSWORD_RESET",
        actionLabel: "Reset Password Akun Staf",
        entityType: "STAFF",
        entityId: staffId,
        performedBy: ownerName,
        userRole: "owner",
        details: {
          title: `Reset Password Login Akun ${target.name}`,
          before: "Password Lama",
          after: `Password Baru Terenkripsi (${newPass.length} karakter)`,
          reason: "Permintaan reset kredensial oleh owner",
        },
      };
      setAuditLogs((prev) => [log, ...prev]);
    }
  };

  const handleUpdateStaffBranch = (
    staffId: string,
    branchId: string,
    branchName: string,
  ) => {
    setStaffAccounts((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, branchId, branchName } : s)),
    );
    const target = staffAccounts.find((s) => s.id === staffId);
    if (target) {
      const log: AuditLogRecord = {
        id: `audit-${Date.now()}`,
        timestamp: `${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}, ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
        date: "24 Sep 2026",
        time: `${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
        action: "STAFF_BRANCH_REASSIGN",
        actionLabel: "Mutasi Penugasan Cabang Staf",
        entityType: "STAFF",
        entityId: staffId,
        performedBy: ownerName,
        userRole: "owner",
        details: {
          title: `Penugasan Staf ${target.name} ke Cabang ${branchName}`,
          before: target.branchName || "Cabang Belum Ditentukan",
          after: branchName,
          reason: "Rotasi penempatan staf kasir operasional",
        },
      };
      setAuditLogs((prev) => [log, ...prev]);
    }
  };

  const handleAddBranch = async (newBranchData: Omit<BranchOutlet, "id">) => {
    let createdBranch: BranchOutlet = {
      ...newBranchData,
      id: `branch-${Date.now()}`,
    };

    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBranchData.name,
          branchCode: newBranchData.branchCode || newBranchData.code,
          address: newBranchData.address,
          city: newBranchData.city || "Jakarta",
          phone: newBranchData.phone || "0812-9988-1234",
          email:
            newBranchData.email ||
            `${(newBranchData.branchCode || "cabang").toLowerCase()}@macmood.id`,
          pin: newBranchData.pin || "1234",
          isActive: newBranchData.isActive !== false,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data?.id) {
          createdBranch = {
            ...createdBranch,
            ...json.data,
            branchCode: json.data.branchCode,
            code: json.data.branchCode,
          };
        }
      }
    } catch (err) {
      console.warn("Failed to create branch on backend:", err);
    }

    setBranches((prev) => {
      const next = [...prev, createdBranch];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("macmood_branches", JSON.stringify(next));
        } catch (e) {
          console.warn("Failed to persist branches:", e);
        }
      }
      return next;
    });

    const log: AuditLogRecord = {
      id: `audit-${Date.now()}`,
      timestamp: `${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}, ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
      date: "26 Sep 2026",
      time: `${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
      action: "BRANCH_CREATED",
      actionLabel: "Penambahan Cabang Baru",
      entityType: "SETTING",
      entityId: createdBranch.id,
      performedBy: ownerName,
      userRole: "owner",
      details: {
        title: `Pembukaan Cabang Baru: ${createdBranch.name} (${createdBranch.branchCode || createdBranch.code})`,
        before: "Belum Terdaftar",
        after: `Lokasi: ${createdBranch.city}, Email Akun: ${createdBranch.email || "-"}`,
        reason: "Ekspansi jaringan gerai MacMood",
      },
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  const handleUpdateBranch = async (
    branchId: string,
    updates: Partial<BranchOutlet>,
  ) => {
    try {
      await fetch(`/api/branches/${branchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updates.name,
          branchCode: updates.branchCode || updates.code,
          address: updates.address,
          city: updates.city,
          phone: updates.phone,
          email: updates.email,
          pin: updates.pin,
          isActive: updates.isActive,
        }),
      });
    } catch (err) {
      console.warn("Failed to update branch on backend:", err);
    }

    setBranches((prev) => {
      const next = prev.map((b) =>
        b.id === branchId ? { ...b, ...updates } : b,
      );
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("macmood_branches", JSON.stringify(next));
        } catch (e) {
          console.warn("Failed to persist branches:", e);
        }
      }
      return next;
    });

    // Synchronize staff branchName if branch name updated
    if (updates.name) {
      setStaffAccounts((prev) =>
        prev.map((s) =>
          s.branchId === branchId ? { ...s, branchName: updates.name } : s,
        ),
      );
    }

    const target = branches.find((b) => b.id === branchId);
    const log: AuditLogRecord = {
      id: `audit-${Date.now()}`,
      timestamp: `${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}, ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
      date: "26 Sep 2026",
      time: `${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
      action: "OUTLET_SETTING_UPDATE",
      actionLabel: "Pembaruan Informasi Cabang",
      entityType: "SETTING",
      entityId: branchId,
      performedBy: ownerName,
      userRole: "owner",
      details: {
        title: `Pembaruan Informasi Cabang: ${updates.name || target?.name}`,
        before: `Kode: ${target?.branchCode || target?.code}, Email: ${target?.email || "-"}`,
        after: `Kode: ${updates.branchCode || target?.branchCode}, Email: ${updates.email || target?.email || "-"}`,
        reason: "Penyesuaian operasional gerai oleh owner",
      },
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  const handleDeleteBranch = async (branchId: string) => {
    if (branchId === "branch-1") return; // Flagship cannot be deleted

    const target = branches.find((b) => b.id === branchId);

    try {
      await fetch(`/api/branches/${branchId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Failed to delete branch on backend:", err);
    }

    setBranches((prev) => {
      const next = prev.filter((b) => b.id !== branchId);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("macmood_branches", JSON.stringify(next));
        } catch (e) {
          console.warn("Failed to persist branches:", e);
        }
      }
      return next;
    });

    // Reassign any staff on this deleted branch to Pusat
    setStaffAccounts((prev) =>
      prev.map((s) =>
        s.branchId === branchId
          ? {
              ...s,
              branchId: "branch-1",
              branchName: "MacMood Pusat - Fatmawati",
            }
          : s,
      ),
    );

    const log: AuditLogRecord = {
      id: `audit-${Date.now()}`,
      timestamp: `${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}, ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
      date: "26 Sep 2026",
      time: `${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
      action: "OUTLET_SETTING_UPDATE",
      actionLabel: "Penutupan / Penghapusan Cabang",
      entityType: "SETTING",
      entityId: branchId,
      performedBy: ownerName,
      userRole: "owner",
      details: {
        title: `Penghapusan Cabang: ${target?.name || branchId}`,
        before: "Status: Cabang Aktif Terdaftar",
        after: "Status: Dihapus (Kredensial dialihkan ke Pusat)",
        reason: "Penutupan titik gerai oleh owner",
      },
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  // Promo Handlers (PRD Fase 2)
  const handleAddPromo = (
    newPromoData: Omit<PromoVoucher, "id" | "usedCount">,
  ) => {
    const newPromo: PromoVoucher = {
      ...newPromoData,
      id: `promo-${Date.now()}`,
      usedCount: 0,
    };
    setPromos((prev) => [newPromo, ...prev]);

    const log: AuditLogRecord = {
      id: `audit-${Date.now()}`,
      timestamp: `${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}, ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
      date: new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
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

    // Push to Backend API
    fetch("/api/promos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: newPromo.code,
        name: newPromo.name,
        description: newPromo.description,
        discountType:
          newPromo.discountType === "FIXED_AMOUNT" ? "FIXED" : "PERCENTAGE",
        discountValue: newPromo.discountValue,
        maxDiscount: newPromo.maxDiscount,
        minSubtotal: newPromo.minOrderAmount,
        maxUsage: newPromo.quota,
        isActive: newPromo.isActive,
        startDate: newPromo.startDate,
        endDate: newPromo.endDate,
      }),
    }).catch(console.warn);
  };

  const handleUpdatePromo = (id: string, updates: Partial<PromoVoucher>) => {
    setPromos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );

    const log: AuditLogRecord = {
      id: `audit-${Date.now()}`,
      timestamp: `${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}, ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
      date: new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
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
      prev.map((p) => (p.id === id ? { ...p, isActive: !currentStatus } : p)),
    );
  };

  // Recipe & Raw Materials Handlers (PRD Fase 2)
  const handleUpdateRecipe = (
    productId: string,
    updatedIngredients: ProductRecipe["ingredients"],
    notes?: string,
  ) => {
    const newTotalHpp = updatedIngredients.reduce(
      (s, i) => s + i.subtotalCost,
      0,
    );

    setRecipes((prev) =>
      prev.map((r) => {
        if (r.productId === productId) {
          const grossMarginAmount = r.sellingPrice - newTotalHpp;
          const grossMarginPercent =
            Math.round(
              ((r.sellingPrice - newTotalHpp) / r.sellingPrice) * 1000,
            ) / 10;
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
      }),
    );

    // Sync product costPrice (HPP) in menu catalog
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, costPrice: newTotalHpp } : p,
      ),
    );

    const targetRecipe = recipes.find((r) => r.productId === productId);
    const log: AuditLogRecord = {
      id: `audit-${Date.now()}`,
      timestamp: `${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}, ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
      date: new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
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

    // Push to Backend API
    if (!productId.startsWith("prod-")) {
      fetch("/api/inventory/recipes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          ingredients: updatedIngredients.map((it) => ({
            rawMaterialId: it.materialId,
            amount: it.amount,
            unit: it.unit,
          })),
        }),
      }).catch(console.warn);
    }
  };

  const handleRestockMaterial = (
    materialId: string,
    addedStock: number,
    newCostPerUnit?: number,
    notes?: string,
  ) => {
    setRawMaterials((prev) =>
      prev.map((m) => {
        if (m.id === materialId) {
          const updatedStock = m.currentStock + addedStock;
          const updatedCost =
            newCostPerUnit && newCostPerUnit > 0
              ? newCostPerUnit
              : m.costPerUnit;
          return {
            ...m,
            currentStock: updatedStock,
            costPerUnit: updatedCost,
            lastRestockDate: "Hari ini",
          };
        }
        return m;
      }),
    );

    const mat = rawMaterials.find((m) => m.id === materialId);
    const log: AuditLogRecord = {
      id: `audit-${Date.now()}`,
      timestamp: `${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}, ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
      date: new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
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

    // Push to Backend API
    if (!materialId.startsWith("rm-")) {
      fetch("/api/inventory/materials/restock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId,
          addedStock,
          totalCost: (newCostPerUnit || 0) * addedStock,
          supplierName: notes,
        }),
      }).catch(console.warn);
    }
  };

  const handleAddNewMaterial = (newMatData: Omit<RawMaterial, "id">) => {
    const newMaterial: RawMaterial = {
      ...newMatData,
      id: `rm-${Date.now()}`,
    };
    setRawMaterials((prev) => [newMaterial, ...prev]);

    // Push to Backend API
    fetch("/api/inventory/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku: newMatData.code,
        name: newMatData.name,
        category: newMatData.category,
        unit: newMatData.unit,
        currentStock: newMatData.currentStock,
        minStock: newMatData.minThreshold,
        costPerUnit: newMatData.costPerUnit,
        supplierName: newMatData.supplier,
      }),
    }).catch(console.warn);
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
        onOpenPosAccessModal={() => setIsPosAccessModalOpen(true)}
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
            <AdminAnalyticsView
              orders={orders}
              products={products}
              expenses={expenses}
              branches={branches}
            />
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
                branches={branches}
                onMutateStock={handleMutateStock}
              />
            </div>
          )}

          {activeTab === "transactions" && (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-12">
              <AdminTransactionsView
                orders={orders}
                branches={branches}
                onVoidOrder={handleVoidOrder}
              />
            </div>
          )}

          {activeTab === "shifts" && (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-12">
              <AdminShiftsView
                shifts={shifts}
                onVerifyShift={handleVerifyShift}
              />
            </div>
          )}

          {activeTab === "expenses" && (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-12">
              <AdminExpensesView
                expenses={expenses}
                onAddExpense={handleAddExpense}
              />
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
                branches={branches}
                onUpdateSettings={setSettings}
                onAddStaff={handleAddStaff}
                onUpdateStaffPin={handleUpdateStaffPin}
                onResetStaffPassword={handleResetStaffPassword}
                onUpdateStaffBranch={handleUpdateStaffBranch}
                onToggleStaffStatus={handleToggleStaffStatus}
                onAddBranch={handleAddBranch}
                onUpdateBranch={handleUpdateBranch}
                onDeleteBranch={handleDeleteBranch}
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

      {/* Secure POS Access Modal for Owner */}
      <AdminPosAccessModal
        isOpen={isPosAccessModalOpen}
        onClose={() => setIsPosAccessModalOpen(false)}
        branches={branches}
      />
    </div>
  );
}
