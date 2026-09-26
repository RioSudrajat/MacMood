export type ProductCategory = "all" | "mac" | "sides" | "drinks";

export interface Product {
  id: string;
  name: string;
  category: "mac" | "sides" | "drinks";
  price: number;
  description: string;
  image: string;
  isAvailable: boolean;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes: string;
}

export interface OrderItemSnapshot {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  notes?: string;
}

export type PaymentMethod = "CASH" | "QRIS_MANUAL" | "QRIS";
export type OrderStatus = "PAID" | "VOID";
export type SyncStatus = "SYNCED" | "PENDING_SYNC";

export interface CompletedOrder {
  id: string;
  orderNumber: string;
  items: OrderItemSnapshot[];
  subtotal: number;
  discount?: number;
  promoCode?: string;
  promoName?: string;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountTendered: number;
  change: number;
  timestamp: string;
  dateStr: string;
  createdAt?: string;
  cashierName: string;
  branchId?: string;
  branchName?: string;
  syncStatus: SyncStatus;
  status: OrderStatus;
  voidReason?: string;
}

export interface ShiftData {
  id: string;
  status: "OPEN" | "CLOSED";
  cashierName: string;
  startTime: string;
  endTime?: string;
  initialCash: number;
  cashSales: number;
  qrisSales: number;
  orderCount: number;
  expectedCash: number;
  actualCash?: number;
  cashDifference?: number;
  notes?: string;
}

export interface PastShift {
  id: string;
  date: string;
  cashierName: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  initialCash: number;
  cashSales: number;
  qrisSales: number;
  expectedCash: number;
  actualCash: number;
  cashDifference: number;
  status: "CLOSED";
  notes: string;
}

export interface SyncQueueItem {
  id: string;
  orderNumber: string;
  createdAt: string;
  total: number;
  paymentMethod: PaymentMethod;
  syncStatus: SyncStatus;
  syncedAt?: string;
  retryCount: number;
}
