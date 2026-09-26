import { db } from "@/db/index.server";
import { rawMaterials, recipes, products } from "@/db/schema";
import { ensureSeededData } from "./seed.service.server";
import { asc, eq } from "drizzle-orm";
import type {
  CreateRawMaterialInput,
  RestockMaterialInput,
} from "@/validators/inventory";

export async function listRawMaterials() {
  await ensureSeededData();
  return db.select().from(rawMaterials).orderBy(asc(rawMaterials.name));
}

export async function createRawMaterial(input: CreateRawMaterialInput) {
  const [newMaterial] = await db
    .insert(rawMaterials)
    .values({
      sku: input.sku.toUpperCase(),
      name: input.name,
      category: input.category,
      unit: input.unit,
      currentStock: String(input.currentStock || 0),
      minStock: String(input.minStock || 0),
      costPerUnit: input.costPerUnit,
      supplierName: input.supplierName || null,
    })
    .returning();
  return newMaterial;
}

export async function restockMaterial(id: string, input: RestockMaterialInput) {
  const [material] = await db
    .select()
    .from(rawMaterials)
    .where(eq(rawMaterials.id, id))
    .limit(1);
  if (!material) throw new Error("Material not found");

  const current = Number(material.currentStock);
  const added = Number(input.addedStock);
  const nextStock = current + added;

  const [updated] = await db
    .update(rawMaterials)
    .set({
      currentStock: String(nextStock),
      ...(input.supplierName ? { supplierName: input.supplierName } : {}),
      updatedAt: new Date(),
    })
    .where(eq(rawMaterials.id, id))
    .returning();

  return updated;
}

export async function listProductRecipes() {
  await ensureSeededData();

  const allProducts = await db
    .select()
    .from(products)
    .orderBy(asc(products.name));
  const allRecipes = await db.select().from(recipes);
  const allMaterials = await db.select().from(rawMaterials);

  return allProducts.map((p) => {
    const pRecipes = allRecipes.filter((r) => r.productId === p.id);

    let calculatedHpp = 0;
    let limitingIngredient = "";
    let maxPortions = 999;

    const ingredientsWithDetail = pRecipes.map((r) => {
      const mat = allMaterials.find((m) => m.id === r.rawMaterialId);
      const amount = Number(r.amount);
      const stock = mat ? Number(mat.currentStock) : 0;
      const costPerUnit = mat ? mat.costPerUnit : 0;

      // Unit conversion for costing
      let costForIngredient = 0;
      let portionsFromThis = 0;

      if (mat?.unit === "kg" && r.unit === "g") {
        // e.g. Rp 22.000 / kg -> Rp 22 / g
        const costPerGram = costPerUnit / 1000;
        costForIngredient = Math.round(costPerGram * amount);
        const stockInGrams = stock * 1000;
        portionsFromThis = amount > 0 ? Math.floor(stockInGrams / amount) : 999;
      } else if (mat?.unit === "ml" && r.unit === "ml") {
        costForIngredient = Math.round(costPerUnit * amount);
        portionsFromThis = amount > 0 ? Math.floor(stock / amount) : 999;
      } else {
        costForIngredient = Math.round(costPerUnit * amount);
        portionsFromThis = amount > 0 ? Math.floor(stock / amount) : 999;
      }

      calculatedHpp += costForIngredient;

      if (portionsFromThis < maxPortions) {
        maxPortions = portionsFromThis;
        limitingIngredient = mat?.name || "Bahan Baku";
      }

      return {
        id: r.id,
        rawMaterialId: r.rawMaterialId,
        materialName: mat?.name || "Unknown Material",
        amount,
        unit: r.unit,
        costSubtotal: costForIngredient,
      };
    });

    // If no recipe, fallback to product's costPrice
    if (calculatedHpp === 0) {
      calculatedHpp = p.costPrice || 0;
      maxPortions = p.currentStock;
    }

    const grossMargin =
      p.price > 0
        ? Math.round(((p.price - calculatedHpp) / p.price) * 1000) / 10
        : 0;

    return {
      productId: p.id,
      productName: p.name,
      categorySlug: p.categorySlug,
      price: p.price,
      calculatedHpp,
      grossMargin,
      availablePortions: maxPortions === 999 ? p.currentStock : maxPortions,
      limitingIngredient: limitingIngredient || undefined,
      ingredients: ingredientsWithDetail,
    };
  });
}

export async function updateProductRecipe(
  productId: string,
  ingredients: { rawMaterialId: string; amount: number; unit: string }[],
) {
  return await db.transaction(async (tx) => {
    // Delete existing ingredients
    await tx.delete(recipes).where(eq(recipes.productId, productId));

    // Insert new ones
    if (ingredients.length > 0) {
      await tx.insert(recipes).values(
        ingredients.map((it) => ({
          productId,
          rawMaterialId: it.rawMaterialId,
          amount: String(it.amount),
          unit: it.unit,
        })),
      );
    }

    return true;
  });
}
