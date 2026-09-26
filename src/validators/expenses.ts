import { z } from "zod";

export const createExpenseSchema = z
  .object({
    branchId: z.string().max(50).optional(),
    branchName: z.string().max(150).optional(),
    title: z.string().trim().min(2).max(150),
    amount: z.coerce.number().int().positive(),
    category: z.enum(["INGREDIENT", "UTILITY", "PACKAGING", "OPERATIONAL"]),
    paymentSource: z.enum(["CASH_DRAWER", "OWNER_TRANSFER"]),
    staffName: z.string().trim().min(1).max(100),
    receiptNumber: z.string().max(100).optional(),
    notes: z.string().max(500).optional(),
  })
  .strict();

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
