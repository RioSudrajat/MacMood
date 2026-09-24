export type AdminTab =
  | "analytics"
  | "products"
  | "inventory"
  | "transactions"
  | "shifts"
  | "expenses"
  | "promos"
  | "recipes"
  | "audit-logs"
  | "settings"
  | "notifications";

export type AdminDatePeriod = "today" | "week" | "month" | "year";

export interface AdminProduct {
  id: string;
  name: string;
  category: "mac" | "sides" | "drinks";
  categoryLabel: string;
  price: number;
  costPrice: number; // Harga Pokok Penjualan (HPP)
  description: string;
  image: string;
  isAvailable: boolean;
  trackStock: boolean;
  currentStock: number;
  lowStockThreshold: number;
  soldCount: number;
}

export type StockMutationReason = "RESTOCK" | "SPOILAGE" | "ADJUSTMENT";

export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  quantityChange: number; // positif (tambah) atau negatif (kurang)
  finalStock: number;
  reason: StockMutationReason;
  reasonLabel: string;
  notes: string;
  staffName: string;
  timestamp: string;
}

export interface StaffAccount {
  id: string;
  name: string;
  email: string;
  role: "cashier" | "owner";
  pin: string; // 4-6 digit PIN
  isActive: boolean;
  lastLogin: string;
}

export interface OutletSettings {
  name: string;
  branchCode: string;
  address: string;
  city: string;
  phone: string;
  timezone: string;
  taxRate: number; // PB1 Restoran (e.g. 10%)
  serviceChargeRate: number;
  qrisMerchantName: string;
  qrisNmid: string;
  bankAccount: string;
  bankName: string;
}

// -------------------------------------------------------------
// Model Rekapitulasi Riwayat Shift Kasir (Tabel SHIFTS di PRD)
// -------------------------------------------------------------
export interface ShiftRecord {
  id: string;
  shiftName: string; // misal: "Shift Pagi (08:00 - 16:00)"
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime: string | null; // null jika shift masih berjalan
  date: string;
  initialCash: number; // Kas modal awal (cash float)
  cashSales: number; // Total penerimaan uang tunai
  qrisSales: number; // Total penerimaan via QRIS
  totalOrders: number; // Jumlah nota transaksi
  expectedCash: number; // initialCash + cashSales
  actualCash: number; // Uang fisik aktual dihitung kasir
  cashDifference: number; // actualCash - expectedCash (0 = seimbang)
  status: "OPEN" | "CLOSED";
  notes?: string;
  verifiedByOwner: boolean;
}

// -------------------------------------------------------------
// Model Pengeluaran Operasional / Biaya Kas Kecil (PRD Fase 2)
// -------------------------------------------------------------
export type ExpenseCategory =
  | "BAHAN_BAKU"
  | "UTILITAS_GAS"
  | "KEMASAN"
  | "KEBERSIHAN"
  | "OPERASIONAL_LAIN";

export interface ExpenseRecord {
  id: string;
  date: string;
  time: string;
  category: ExpenseCategory;
  categoryLabel: string;
  description: string;
  amount: number;
  sourceOfFund: "KAS_LACI" | "TRANSFER_OWNER";
  staffName: string;
  notes?: string;
  receiptNumber?: string;
}

// -------------------------------------------------------------
// Model Diskon, Voucher & Promo Dinamis (PRD Fase 2)
// -------------------------------------------------------------
export type PromoDiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export interface PromoVoucher {
  id: string;
  code: string; // e.g. "MACMOOD10", "HEMAT5K"
  name: string; // e.g. "Diskon Launching 10%"
  discountType: PromoDiscountType;
  discountValue: number; // e.g. 10 (%) atau 5000 (Rp)
  maxDiscount?: number; // e.g. Rp 15.000 (untuk tipe PERCENTAGE)
  minOrderAmount: number; // e.g. Rp 30.000
  quota: number; // Kuota penggunaan total
  usedCount: number; // Jumlah yang sudah terpakai
  startDate: string; // e.g. "2026-09-01"
  endDate: string; // e.g. "2026-10-31"
  isActive: boolean;
  description: string;
}

// -------------------------------------------------------------------------
// Model Manajemen Resep & Bahan Baku Mentah (Recipe Management - BOM Fase 2)
// -------------------------------------------------------------------------
export type RawMaterialUnit = "gram" | "kg" | "ml" | "liter" | "pcs";
export type RawMaterialCategory =
  | "PASTA"
  | "DAIRY_CHEESE"
  | "PROTEIN"
  | "SEASONING"
  | "PACKAGING";

export interface RawMaterial {
  id: string;
  code: string; // e.g. "RM-MAC-01"
  name: string; // e.g. "Makaroni Elbow Kering"
  category: RawMaterialCategory;
  categoryLabel: string;
  currentStock: number; // Dalam satuan terkecil (gram / ml / pcs)
  unit: RawMaterialUnit;
  minThreshold: number; // Batas peringatan stok menipis
  costPerUnit: number; // Harga modal beli per satuan baku (e.g. Rp 32 / gram)
  supplier: string;
  lastRestockDate: string;
}

export interface RecipeIngredient {
  materialId: string;
  materialName: string;
  amount: number; // Takaran per porsi (e.g. 100 gram, 45 ml, 1 pcs)
  unit: RawMaterialUnit;
  costPerUnit: number; // Snapshot harga modal saat ini
  subtotalCost: number; // amount * costPerUnit
}

export interface ProductRecipe {
  productId: string;
  productName: string;
  category: "mac" | "sides" | "drinks";
  sellingPrice: number;
  ingredients: RecipeIngredient[];
  totalHpp: number; // Jumlah subtotalCost semua bahan
  grossMarginAmount: number; // sellingPrice - totalHpp
  grossMarginPercent: number; // ((sellingPrice - totalHpp) / sellingPrice) * 100
  maxPortionsAvailable: number; // Dihitung dari stok bahan baku terkecil
  limitingMaterialName: string; // Bahan yang paling cepat habis
  notes?: string;
}

// -------------------------------------------------------------
// Model Audit Log Keamanan & Sistem (Tabel AUDIT_LOGS di PRD)
// -------------------------------------------------------------
export type AuditActionType =
  | "MENU_PRICE_CHANGE"
  | "MENU_AVAILABILITY_CHANGE"
  | "VOID_ORDER"
  | "STAFF_PIN_RESET"
  | "SHIFT_FORCE_CLOSE"
  | "OUTLET_SETTING_UPDATE"
  | "EXPENSE_RECORDED"
  | "STOCK_MUTATION"
  | "PROMO_CREATED"
  | "PROMO_UPDATED"
  | "PROMO_TOGGLED"
  | "RECIPE_UPDATED"
  | "RAW_MATERIAL_RESTOCKED";

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  date: string;
  time: string;
  action: AuditActionType;
  actionLabel: string;
  entityType: "PRODUCT" | "ORDER" | "STAFF" | "SHIFT" | "SETTING" | "EXPENSE" | "STOCK" | "PROMO" | "RECIPE" | "RAW_MATERIAL";
  entityId: string;
  performedBy: string;
  userRole: "owner" | "cashier";
  details: {
    title: string;
    before?: string;
    after?: string;
    reason?: string;
  };
}
