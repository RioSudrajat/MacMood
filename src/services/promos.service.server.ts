import { db } from "@/db/index.server";
import { promos } from "@/db/schema";
import { ensureSeededData } from "./seed.service.server";
import { desc, eq } from "drizzle-orm";
import type { CreatePromoInput, UpdatePromoInput } from "@/validators/promos";

export async function listPromos(activeOnly?: boolean) {
  await ensureSeededData();
  const query = db.select().from(promos);
  if (activeOnly) {
    query.where(eq(promos.isActive, true));
  }
  return query.orderBy(desc(promos.createdAt));
}

export async function validatePromo(code: string, subtotal: number) {
  await ensureSeededData();
  const [promo] = await db
    .select()
    .from(promos)
    .where(eq(promos.code, code.toUpperCase()))
    .limit(1);

  if (!promo) {
    return { valid: false, message: `Voucher '${code}' tidak ditemukan.` };
  }

  if (!promo.isActive) {
    return { valid: false, message: `Voucher '${code}' sedang dinonaktifkan.` };
  }

  if (promo.minSubtotal && subtotal < promo.minSubtotal) {
    const diff = promo.minSubtotal - subtotal;
    return {
      valid: false,
      message: `Minimal belanja Rp ${promo.minSubtotal.toLocaleString("id-ID")}. Kurang Rp ${diff.toLocaleString("id-ID")}.`,
    };
  }

  if (promo.maxUsage && promo.currentUsage >= promo.maxUsage) {
    return { valid: false, message: `Kuota pemakaian voucher '${code}' sudah habis.` };
  }

  // Calculate discount
  let discountAmount = 0;
  if (promo.discountType === "PERCENTAGE") {
    const calculated = Math.round((subtotal * promo.discountValue) / 100);
    discountAmount = promo.maxDiscount ? Math.min(calculated, promo.maxDiscount) : calculated;
  } else {
    discountAmount = promo.discountValue;
  }

  return {
    valid: true,
    promo,
    discountAmount: Math.min(discountAmount, subtotal),
  };
}

export async function createPromo(input: CreatePromoInput) {
  const [newPromo] = await db
    .insert(promos)
    .values({
      code: input.code.toUpperCase(),
      name: input.name,
      description: input.description || null,
      discountType: input.discountType,
      discountValue: input.discountValue,
      maxDiscount: input.maxDiscount || null,
      minSubtotal: input.minSubtotal || 0,
      maxUsage: input.maxUsage || null,
      isActive: input.isActive,
      startDate: input.startDate ? new Date(input.startDate) : new Date(),
      endDate: input.endDate ? new Date(input.endDate) : null,
    })
    .returning();
  return newPromo;
}

export async function updatePromo(id: string, input: UpdatePromoInput) {
  const [updated] = await db
    .update(promos)
    .set({
      ...(input.code ? { code: input.code.toUpperCase() } : {}),
      ...(input.name ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.discountType ? { discountType: input.discountType } : {}),
      ...(input.discountValue !== undefined ? { discountValue: input.discountValue } : {}),
      ...(input.maxDiscount !== undefined ? { maxDiscount: input.maxDiscount } : {}),
      ...(input.minSubtotal !== undefined ? { minSubtotal: input.minSubtotal } : {}),
      ...(input.maxUsage !== undefined ? { maxUsage: input.maxUsage } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.startDate ? { startDate: new Date(input.startDate) } : {}),
      ...(input.endDate ? { endDate: new Date(input.endDate) } : {}),
    })
    .where(eq(promos.id, id))
    .returning();
  return updated;
}

export async function togglePromo(id: string, isActive: boolean) {
  const [updated] = await db
    .update(promos)
    .set({ isActive })
    .where(eq(promos.id, id))
    .returning();
  return updated;
}

export async function deletePromo(id: string) {
  const [deleted] = await db.delete(promos).where(eq(promos.id, id)).returning({ id: promos.id });
  return Boolean(deleted);
}
