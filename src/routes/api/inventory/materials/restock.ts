import { createFileRoute } from "@tanstack/react-router";
import { readJson, withApiSession } from "@/lib/api.server";
import { restockMaterial } from "@/services/inventory.service.server";
import { restockMaterialSchema } from "@/validators/inventory";

export const Route = createFileRoute("/api/inventory/materials/restock")({
  server: {
    handlers: {
      POST: ({ request }) =>
        withApiSession(request, async () => {
          const body = (await readJson(request)) as {
            materialId: string;
            addedStock: number;
            totalCost: number;
            supplierName?: string;
          };
          if (!body?.materialId) {
            return Response.json(
              {
                error: {
                  code: "MISSING_ID",
                  message: "materialId is required",
                },
              },
              { status: 400 },
            );
          }
          const input = restockMaterialSchema.parse({
            addedStock: body.addedStock,
            totalCost: body.totalCost,
            supplierName: body.supplierName,
          });
          const updated = await restockMaterial(body.materialId, input);
          return Response.json({ data: updated });
        }),
    },
  },
});
