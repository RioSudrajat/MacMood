import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const branches = pgTable("branches", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  branchCode: varchar("branch_code", { length: 50 }).notNull().unique(),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  pin: varchar("pin", { length: 10 }).default("1234").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  taxRate: integer("tax_rate").default(10).notNull(),
  serviceChargeRate: integer("service_charge_rate").default(0).notNull(),
  qrisMerchantName: varchar("qris_merchant_name", { length: 150 }),
  qrisNmid: varchar("qris_nmid", { length: 100 }),
  bankAccount: varchar("bank_account", { length: 100 }),
  bankName: varchar("bank_name", { length: 100 }),
  openedAt: varchar("opened_at", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
