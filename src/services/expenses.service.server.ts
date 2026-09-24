import { db } from "@/db/index.server";
import { expenses, shifts } from "@/db/schema";
import { ensureSeededData } from "./seed.service.server";
import { desc, eq, sql } from "drizzle-orm";
import type { CreateExpenseInput } from "@/validators/expenses";

export async function listExpenses() {
  await ensureSeededData();
  return db.select().from(expenses).orderBy(desc(expenses.createdAt));
}

export async function createExpense(input: CreateExpenseInput, userId?: string) {
  await ensureSeededData();

  const [newExpense] = await db
    .insert(expenses)
    .values({
      userId: userId || null,
      title: input.title,
      amount: input.amount,
      category: input.category,
      paymentSource: input.paymentSource,
      staffName: input.staffName,
      receiptNumber: input.receiptNumber || null,
      notes: input.notes || null,
    })
    .returning();

  // If paid from cash drawer, deduct from open shift's expectedCash
  if (input.paymentSource === "CASH_DRAWER") {
    const [openShift] = await db
      .select()
      .from(shifts)
      .where(eq(shifts.status, "OPEN"))
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
