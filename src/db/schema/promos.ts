import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const promos = pgTable("promos", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  discountType: varchar("discount_type", { length: 20 }).notNull(), // 'PERCENTAGE' | 'FIXED'
  discountValue: integer("discount_value").notNull(),
  maxDiscount: integer("max_discount"),
  minSubtotal: integer("min_subtotal").default(0).notNull(),
  maxUsage: integer("max_usage"),
  currentUsage: integer("current_usage").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  startDate: timestamp("start_date", { withTimezone: true })
    .defaultNow()
    .notNull(),
  endDate: timestamp("end_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
