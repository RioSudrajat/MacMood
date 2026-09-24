import { createFileRoute } from "@tanstack/react-router";
import { readJson, withApiSession } from "@/lib/api.server";
import { createPromo, listPromos } from "@/services/promos.service.server";
import { createPromoSchema } from "@/validators/promos";

export const Route = createFileRoute("/api/promos/")({
  server: {
    handlers: {
      GET: ({ request }) =>
        withApiSession(request, async () => {
          const url = new URL(request.url);
          const activeOnly = url.searchParams.get("active") === "true";
          const data = await listPromos(activeOnly);
          return Response.json({ data });
        }),
      POST: ({ request }) =>
        withApiSession(request, async () => {
          const body = await readJson(request);
          const input = createPromoSchema.parse(body);
          const promo = await createPromo(input);
          return Response.json({ data: promo }, { status: 201 });
        }),
    },
  },
});
