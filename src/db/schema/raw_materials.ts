import { integer, numeric, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const rawMaterials = pgTable("raw_materials", {
  id: uuid("id").defaultRandom().primaryKey(),
  sku: varchar("sku", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // 'DAIRY' | 'STAPLE' | 'MEAT' | 'SAUCE' | 'BEVERAGE' | 'PACKAGING'
  unit: varchar("unit", { length: 20 }).notNull(), // 'g' | 'kg' | 'ml' | 'pcs'
  currentStock: numeric("current_stock", { precision: 12, scale: 2 }).default("0").notNull(),
  minStock: numeric("min_stock", { precision: 12, scale: 2 }).default("0").notNull(),
  costPerUnit: integer("cost_per_unit").default(0).notNull(),
  supplierName: varchar("supplier_name", { length: 150 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
