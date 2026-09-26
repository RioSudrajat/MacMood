import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { branches } from "./branches";
import { user } from "./user";

export const shifts = pgTable("shifts", {
  id: uuid("id").defaultRandom().primaryKey(),
  branchId: varchar("branch_id", { length: 50 }).references(() => branches.id, {
    onDelete: "set null",
  }),
  branchName: varchar("branch_name", { length: 150 }),
  branchCode: varchar("branch_code", { length: 50 }),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  shiftCode: varchar("shift_code", { length: 50 }).notNull().unique(),
  staffName: varchar("staff_name", { length: 100 }).notNull(),
  startTime: timestamp("start_time", { withTimezone: true })
    .defaultNow()
    .notNull(),

  endTime: timestamp("end_time", { withTimezone: true }),
  initialCash: integer("initial_cash").default(0).notNull(),
  cashSales: integer("cash_sales").default(0).notNull(),
  qrisSales: integer("qris_sales").default(0).notNull(),
  totalOrders: integer("total_orders").default(0).notNull(),
  expectedCash: integer("expected_cash").default(0).notNull(),
  actualCash: integer("actual_cash"),
  cashDifference: integer("cash_difference").default(0).notNull(),
  status: varchar("status", { length: 20 }).default("OPEN").notNull(), // 'OPEN' | 'CLOSED'
  isVerified: boolean("is_verified").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
