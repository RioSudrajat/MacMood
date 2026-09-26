import { z } from "zod";

export const createRawMaterialSchema = z
  .object({
    sku: z.string().trim().min(2).max(50),
    name: z.string().trim().min(2).max(150),
    category: z.enum([
      "DAIRY",
      "STAPLE",
      "MEAT",
      "SAUCE",
      "BEVERAGE",
      "PACKAGING",
    ]),
    unit: z.enum(["g", "kg", "ml", "pcs"]),
    currentStock: z.coerce.number().min(0).default(0),
    minStock: z.coerce.number().min(0).default(0),
    costPerUnit: z.coerce.number().int().min(0).default(0),
    supplierName: z.string().max(150).optional(),
  })
  .strict();

export const restockMaterialSchema = z
  .object({
    addedStock: z.coerce.number().positive(),
    totalCost: z.coerce.number().int().min(0),
    supplierName: z.string().max(150).optional(),
  })
  .strict();

export const updateRecipeSchema = z
  .object({
    productId: z.string().uuid(),
    ingredients: z.array(
      z.object({
        rawMaterialId: z.string().uuid(),
        amount: z.coerce.number().positive(),
        unit: z.string().min(1).max(20),
      }),
    ),
  })
  .strict();

export type CreateRawMaterialInput = z.infer<typeof createRawMaterialSchema>;
export type RestockMaterialInput = z.infer<typeof restockMaterialSchema>;
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;
