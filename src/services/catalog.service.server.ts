import { db } from "@/db/index.server";
import { categories, products } from "@/db/schema";
import { ensureSeededData } from "./seed.service.server";
import { asc, eq } from "drizzle-orm";
import type { CreateProductInput, UpdateProductInput } from "@/validators/catalog";

export async function listCategories() {
  await ensureSeededData();
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function listProducts(filter?: { categorySlug?: string; availableOnly?: boolean }) {
  await ensureSeededData();
  const query = db.select().from(products);
  
  if (filter?.categorySlug && filter.categorySlug !== "all") {
    query.where(eq(products.categorySlug, filter.categorySlug));
  }
  
  return query.orderBy(asc(products.name));
}

export async function getProduct(id: string) {
  await ensureSeededData();
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return product;
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

export async function toggleProductAvailability(id: string, isAvailable: boolean) {
  const [updated] = await db
    .update(products)
    .set({ isAvailable, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();
  return updated;
}

export async function deleteProduct(id: string) {
  const [deleted] = await db.delete(products).where(eq(products.id, id)).returning({ id: products.id });
  return Boolean(deleted);
}
