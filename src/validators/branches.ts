import { z } from "zod";

export const branchInputSchema = z
  .object({
    id: z.string().trim().min(1).max(50).optional(),
    name: z.string().trim().min(2).max(150),
    branchCode: z.string().trim().min(2).max(50),
    address: z.string().trim().min(5),
    city: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(5).max(50),
    email: z.string().trim().email().max(150),
    pin: z.string().trim().min(4).max(10).default("1234"),
    isActive: z.boolean().default(true),
    taxRate: z.coerce.number().int().min(0).max(30).default(10),
    serviceChargeRate: z.coerce.number().int().min(0).max(30).default(0),
    qrisMerchantName: z.string().trim().max(150).optional(),
    qrisNmid: z.string().trim().max(100).optional(),
    bankAccount: z.string().trim().max(100).optional(),
    bankName: z.string().trim().max(100).optional(),
    openedAt: z.string().trim().max(100).optional(),
  })
  .strict();

export const updateBranchSchema = branchInputSchema.partial().strict();

export type BranchInput = z.infer<typeof branchInputSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
