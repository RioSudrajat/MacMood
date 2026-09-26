import { db } from "@/db/index.server";
import { branches } from "@/db/schema";
import { ensureSeededData } from "./seed.service.server";
import { asc, eq } from "drizzle-orm";
import type { BranchInput, UpdateBranchInput } from "@/validators/branches";

export async function listBranches() {
  await ensureSeededData();
  return db.select().from(branches).orderBy(asc(branches.createdAt));
}

export async function getBranch(id: string) {
  await ensureSeededData();
  const [branch] = await db
    .select()
    .from(branches)
    .where(eq(branches.id, id))
    .limit(1);
  return branch || null;
}

export async function createBranch(input: BranchInput) {
  await ensureSeededData();
  const branchId = input.id || `branch-${Date.now().toString().slice(-4)}`;

  const [created] = await db
    .insert(branches)
    .values({
      id: branchId,
      name: input.name,
      branchCode: input.branchCode.toUpperCase(),
      address: input.address,
      city: input.city,
      phone: input.phone,
      email: input.email.toLowerCase(),
      pin: input.pin || "1234",
      isActive: input.isActive !== false,
      taxRate: input.taxRate ?? 10,
      serviceChargeRate: input.serviceChargeRate ?? 0,
      qrisMerchantName: input.qrisMerchantName || input.name.toUpperCase(),
      qrisNmid: input.qrisNmid || null,
      bankAccount: input.bankAccount || null,
      bankName: input.bankName || "BCA",
      openedAt:
        input.openedAt ||
        new Date().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
    })
    .returning();

  return created;
}

export async function updateBranch(id: string, updates: UpdateBranchInput) {
  await ensureSeededData();

  const patchData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (updates.name !== undefined) patchData.name = updates.name;
  if (updates.branchCode !== undefined)
    patchData.branchCode = updates.branchCode.toUpperCase();
  if (updates.address !== undefined) patchData.address = updates.address;
  if (updates.city !== undefined) patchData.city = updates.city;
  if (updates.phone !== undefined) patchData.phone = updates.phone;
  if (updates.email !== undefined)
    patchData.email = updates.email.toLowerCase();
  if (updates.pin !== undefined) patchData.pin = updates.pin;
  if (updates.isActive !== undefined) patchData.isActive = updates.isActive;
  if (updates.taxRate !== undefined) patchData.taxRate = updates.taxRate;
  if (updates.serviceChargeRate !== undefined)
    patchData.serviceChargeRate = updates.serviceChargeRate;
  if (updates.qrisMerchantName !== undefined)
    patchData.qrisMerchantName = updates.qrisMerchantName;
  if (updates.qrisNmid !== undefined) patchData.qrisNmid = updates.qrisNmid;
  if (updates.bankAccount !== undefined)
    patchData.bankAccount = updates.bankAccount;
  if (updates.bankName !== undefined) patchData.bankName = updates.bankName;

  const [updated] = await db
    .update(branches)
    .set(patchData)
    .where(eq(branches.id, id))
    .returning();

  return updated || null;
}

export async function deleteBranch(id: string) {
  if (id === "branch-1") {
    throw new Error("Cabang Utama (Pusat) dilindungi dan tidak dapat dihapus");
  }

  const [deleted] = await db
    .delete(branches)
    .where(eq(branches.id, id))
    .returning();
  return deleted || null;
}
