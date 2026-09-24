import { boolean, integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { categories } from "./categories";

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  categorySlug: varchar("category_slug", { length: 50 }).notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  costPrice: integer("cost_price").default(0).notNull(),
  imageUrl: text("image_url"),
  badge: varchar("badge", { length: 50 }),
  isAvailable: boolean("is_available").default(true).notNull(),
  trackStock: boolean("track_stock").default(true).notNull(),
  currentStock: integer("current_stock").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
