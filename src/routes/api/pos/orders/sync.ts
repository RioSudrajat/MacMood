import { createFileRoute } from "@tanstack/react-router";
import { readJson, withApiSession } from "@/lib/api.server";
import { syncOfflineOrders } from "@/services/pos.service.server";
import { syncOfflineOrdersSchema } from "@/validators/pos";

export const Route = createFileRoute("/api/pos/orders/sync")({
  server: {
    handlers: {
      POST: ({ request }) =>
        withApiSession(request, async (session) => {
          const body = await readJson(request);
          const input = syncOfflineOrdersSchema.parse(body);
          const results = await syncOfflineOrders(input.orders, session.user.id);
          return Response.json({ success: true, count: results.length, data: results });
        }),
    },
  },
});
