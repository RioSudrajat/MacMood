import { db } from "@/db/index.server";
import { expenses, shifts } from "@/db/schema";
import { ensureSeededData } from "./seed.service.server";
import { desc, eq, sql } from "drizzle-orm";
import type { CreateExpenseInput } from "@/validators/expenses";

export async function listExpenses(branchId?: string) {
  await ensureSeededData();
  const query = db.select().from(expenses);
  if (branchId && branchId !== "all") {
    query.where(eq(expenses.branchId, branchId));
  }
  return query.orderBy(desc(expenses.createdAt));
}

export async function createExpense(input: CreateExpenseInput, userId?: string) {
  await ensureSeededData();

  const [newExpense] = await db
    .insert(expenses)
    .values({
      userId: userId || null,
      branchId: input.branchId || null,
      branchName: input.branchName || null,
      title: input.title,
      amount: input.amount,
      category: input.category,
      paymentSource: input.paymentSource,
      staffName: input.staffName,
      receiptNumber: input.receiptNumber || null,
      notes: input.notes || null,
    })
    .returning();

  // If paid from cash drawer, deduct from open shift's expectedCash (for this branch if provided)
  if (input.paymentSource === "CASH_DRAWER") {
    const conditions = [eq(shifts.status, "OPEN")];
    if (input.branchId) {
      conditions.push(eq(shifts.branchId, input.branchId));
    }
    const [openShift] = await db
      .select()
      .from(shifts)
      .where(conditions.length > 1 ? sql`${shifts.status} = 'OPEN' AND ${shifts.branchId} = ${input.branchId}` : eq(shifts.status, "OPEN"))
      .orderBy(desc(shifts.startTime))
      .limit(1);

    if (openShift) {
      await db
        .update(shifts)
        .set({
          expectedCash: sql`${shifts.expectedCash} - ${input.amount}`,
        })
        .where(eq(shifts.id, openShift.id));
    }
  }


  return newExpense;
}
