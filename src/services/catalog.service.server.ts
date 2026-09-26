import { db } from "@/db/index.server";
import { categories, products, orderItems, orders } from "@/db/schema";
import { ensureSeededData } from "./seed.service.server";
import { asc, eq, sql } from "drizzle-orm";
import type {
  CreateProductInput,
  UpdateProductInput,
} from "@/validators/catalog";

export async function listCategories() {
  await ensureSeededData();
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function listProducts(filter?: {
  categorySlug?: string;
  availableOnly?: boolean;
}) {
  await ensureSeededData();
  const query = db.select().from(products);

  if (filter?.categorySlug && filter.categorySlug !== "all") {
    query.where(eq(products.categorySlug, filter.categorySlug));
  }

  const prods = await query.orderBy(asc(products.name));

  // Compute sold counts directly from relational order_items and orders
  const salesRows = await db
    .select({
      productId: orderItems.productId,
      productName: orderItems.productName,
      branchId: orders.branchId,
      totalQuantity: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(sql`${orders.paymentStatus} != 'REFUNDED'`)
    .groupBy(orderItems.productId, orderItems.productName, orders.branchId);

  const salesMap = new Map<
    string,
    { total: number; byBranch: Record<string, number> }
  >();
  for (const row of salesRows) {
    const key = row.productId || row.productName;
    const cur = salesMap.get(key) || { total: 0, byBranch: {} };
    cur.total += row.totalQuantity;
    if (row.branchId) {
      cur.byBranch[row.branchId] =
        (cur.byBranch[row.branchId] || 0) + row.totalQuantity;
    }
    salesMap.set(key, cur);
    if (row.productName && row.productName !== key) {
      salesMap.set(row.productName, cur);
    }
  }

  const enriched = prods.map((p) => {
    const sales = salesMap.get(p.id) ||
      salesMap.get(p.name) || { total: 0, byBranch: {} };
    return {
      ...p,
      soldCount: sales.total,
      branchSoldCounts: sales.byBranch,
    };
  });

  if (filter?.availableOnly) {
    return enriched.filter((p) => p.isAvailable);
  }

  return enriched;
}

export async function getProduct(id: string) {
  await ensureSeededData();
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  if (!product) return null;

  const salesRows = await db
    .select({
      branchId: orders.branchId,
      totalQuantity: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(
      sql`(${orderItems.productId} = ${id} OR ${orderItems.productName} = ${product.name}) AND ${orders.paymentStatus} != 'REFUNDED'`,
    )
    .groupBy(orders.branchId);

  let totalSold = 0;
  const byBranch: Record<string, number> = {};
  for (const r of salesRows) {
    totalSold += r.totalQuantity;
    if (r.branchId)
      byBranch[r.branchId] = (byBranch[r.branchId] || 0) + r.totalQuantity;
  }

  return {
    ...product,
    soldCount: totalSold,
    branchSoldCounts: byBranch,
  };
}

export async function createProduct(input: CreateProductInput) {
  const [product] = await db
    .insert(products)
    .values({
      name: input.name,
      categoryId: input.categoryId,
      categorySlug: input.categorySlug,
      description: input.description,
      price: input.price,
      costPrice: input.costPrice,
      imageUrl: input.imageUrl,
      badge: input.badge,
      isAvailable: input.isAvailable,
      trackStock: input.trackStock,
      currentStock: input.currentStock,
    })
    .returning();
  return product;
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  const [updated] = await db
    .update(products)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))
    .returning();
  return updated;
}

export async function toggleProductAvailability(
  id: string,
  isAvailable: boolean,
) {
  const [updated] = await db
    .update(products)
    .set({ isAvailable, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();
  return updated;
}

export async function deleteProduct(id: string) {
  const [deleted] = await db
    .delete(products)
    .where(eq(products.id, id))
    .returning({ id: products.id });
  return Boolean(deleted);
}
