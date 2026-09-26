import { integer, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { orders } from "./orders";
import { products } from "./products";

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  productName: varchar("product_name", { length: 150 }).notNull(),
  price: integer("price").notNull(),
  quantity: integer("quantity").notNull(),
  subtotal: integer("subtotal").notNull(),
  notes: text("notes"),
});
