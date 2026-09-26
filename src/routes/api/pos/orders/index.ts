import { createFileRoute } from "@tanstack/react-router";
import { readJson, withApiSession } from "@/lib/api.server";
import { createOrder, listOrders } from "@/services/pos.service.server";
import { createOrderSchema } from "@/validators/pos";

export const Route = createFileRoute("/api/pos/orders/")({
  server: {
    handlers: {
      GET: ({ request }) =>
        withApiSession(request, async () => {
          const url = new URL(request.url);
          const limit = Number(url.searchParams.get("limit")) || 100;
          const offset = Number(url.searchParams.get("offset")) || 0;
          const shiftId = url.searchParams.get("shiftId") || undefined;
          const branchId = url.searchParams.get("branchId") || undefined;
          const data = await listOrders({ limit, offset, shiftId, branchId });
          return Response.json({ data });
        }),
      POST: ({ request }) =>
        withApiSession(request, async (session) => {
          const body = await readJson(request);
          const input = createOrderSchema.parse(body);
          const order = await createOrder(input, session.user.id);
          return Response.json({ data: order }, { status: 201 });
        }),
    },
  },
});
