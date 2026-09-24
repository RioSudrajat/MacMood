import { integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { user } from "./user";

export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  title: varchar("title", { length: 150 }).notNull(),
  amount: integer("amount").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // 'INGREDIENT' | 'UTILITY' | 'PACKAGING' | 'OPERATIONAL'
  paymentSource: varchar("payment_source", { length: 50 }).notNull(), // 'CASH_DRAWER' | 'OWNER_TRANSFER'
  staffName: varchar("staff_name", { length: 100 }).notNull(),
  receiptNumber: varchar("receipt_number", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
