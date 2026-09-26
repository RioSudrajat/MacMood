import { createFileRoute } from "@tanstack/react-router";
import { readJson, withApiSession } from "@/lib/api.server";
import {
  listProductRecipes,
  updateProductRecipe,
} from "@/services/inventory.service.server";
import { updateRecipeSchema } from "@/validators/inventory";

export const Route = createFileRoute("/api/inventory/recipes/")({
  server: {
    handlers: {
      GET: ({ request }) =>
        withApiSession(request, async () => {
          const data = await listProductRecipes();
          return Response.json({ data });
        }),
      PUT: ({ request }) =>
        withApiSession(request, async () => {
          const body = await readJson(request);
          const input = updateRecipeSchema.parse(body);
          await updateProductRecipe(input.productId, input.ingredients);
          return Response.json({ success: true });
        }),
    },
  },
});
