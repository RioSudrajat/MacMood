import { createFileRoute } from "@tanstack/react-router";
import { withApiSession } from "@/lib/api.server";
import { listCategories } from "@/services/catalog.service.server";

export const Route = createFileRoute("/api/catalog/categories/")({
  server: {
    handlers: {
      GET: ({ request }) =>
        withApiSession(request, async () => {
          const data = await listCategories();
          return Response.json({ data });
        }),
    },
  },
});
