import { createFileRoute } from "@tanstack/react-router";
import { readJson, withApiSession } from "@/lib/api.server";
import { createRawMaterial, listRawMaterials } from "@/services/inventory.service.server";
import { createRawMaterialSchema } from "@/validators/inventory";

export const Route = createFileRoute("/api/inventory/materials/")({
  server: {
    handlers: {
      GET: ({ request }) =>
        withApiSession(request, async () => {
          const data = await listRawMaterials();
          return Response.json({ data });
        }),
      POST: ({ request }) =>
        withApiSession(request, async () => {
          const body = await readJson(request);
          const input = createRawMaterialSchema.parse(body);
          const material = await createRawMaterial(input);
          return Response.json({ data: material }, { status: 201 });
        }),
    },
  },
});
