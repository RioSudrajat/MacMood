import { createFileRoute } from "@tanstack/react-router";
import { readJson, withApiSession } from "@/lib/api.server";
import { validatePromo } from "@/services/promos.service.server";
import { validatePromoSchema } from "@/validators/promos";

export const Route = createFileRoute("/api/promos/validate")({
  server: {
    handlers: {
      POST: ({ request }) =>
        withApiSession(request, async () => {
          const body = await readJson(request);
          const input = validatePromoSchema.parse(body);
          const result = await validatePromo(input.code, input.subtotal);
          return Response.json(result);
        }),
    },
  },
});
