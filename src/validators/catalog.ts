import { z } from "zod";

export const createProductSchema = z
  .object({
    name: z.string().trim().min(1).max(150),
    categoryId: z.string().uuid().optional(),
    categorySlug: z.string().min(1).max(50),
    description: z.string().max(1000).optional(),
    price: z.coerce.number().int().min(0),
    costPrice: z.coerce.number().int().min(0).default(0),
    imageUrl: z.string().optional(),
    badge: z.string().max(50).optional(),
    isAvailable: z.boolean().default(true),
    trackStock: z.boolean().default(true),
    currentStock: z.coerce.number().int().min(0).default(0),
  })
  .strict();

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
