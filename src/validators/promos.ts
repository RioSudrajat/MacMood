import { z } from "zod";

export const createPromoSchema = z
  .object({
    code: z.string().trim().min(2).max(50),
    name: z.string().trim().min(2).max(150),
    description: z.string().max(500).optional(),
    discountType: z.enum(["PERCENTAGE", "FIXED"]),
    discountValue: z.coerce.number().int().min(1),
    maxDiscount: z.coerce.number().int().min(1).optional(),
    minSubtotal: z.coerce.number().int().min(0).default(0),
    maxUsage: z.coerce.number().int().min(1).optional(),
    isActive: z.boolean().default(true),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .strict();

export const updatePromoSchema = createPromoSchema.partial();

export const validatePromoSchema = z
  .object({
    code: z.string().trim().min(1),
    subtotal: z.coerce.number().int().min(0),
  })
  .strict();

export type CreatePromoInput = z.infer<typeof createPromoSchema>;
export type UpdatePromoInput = z.infer<typeof updatePromoSchema>;
export type ValidatePromoInput = z.infer<typeof validatePromoSchema>;
