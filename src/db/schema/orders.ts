import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { branches } from "./branches";
import { shifts } from "./shifts";
import { user } from "./user";

export const orders = pgTable("orders", {
  id: text("id").primaryKey(), // Support client-generated UUID for offline idempotency
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  branchId: varchar("branch_id", { length: 50 }).references(() => branches.id, {
    onDelete: "set null",
  }),
  branchName: varchar("branch_name", { length: 150 }),
  shiftId: uuid("shift_id").references(() => shifts.id, {
    onDelete: "set null",
  }),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  cashierName: varchar("cashier_name", { length: 100 }).notNull(),
  customerName: varchar("customer_name", { length: 100 }).default("Pelanggan"),

  subtotal: integer("subtotal").notNull(),
  discount: integer("discount").default(0).notNull(),
  promoCode: varchar("promo_code", { length: 50 }),
  promoName: varchar("promo_name", { length: 150 }),
  tax: integer("tax").default(0).notNull(),
  total: integer("total").notNull(),
  paymentMethod: varchar("payment_method", { length: 30 }).notNull(), // 'CASH' | 'QRIS'
  paymentStatus: varchar("payment_status", { length: 30 })
    .default("PAID")
    .notNull(), // 'PAID' | 'REFUNDED'
  amountTendered: integer("amount_tendered"),
  changeAmount: integer("change_amount").default(0).notNull(),
  notes: text("notes"),
  syncStatus: varchar("sync_status", { length: 20 })
    .default("SYNCED")
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
