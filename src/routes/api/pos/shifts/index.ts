import { createFileRoute } from "@tanstack/react-router";
import { readJson, withApiSession } from "@/lib/api.server";
import {
  getActiveShift,
  listPastShifts,
  openShift,
} from "@/services/pos.service.server";
import { openShiftSchema } from "@/validators/pos";

export const Route = createFileRoute("/api/pos/shifts/")({
  server: {
    handlers: {
      GET: ({ request }) =>
        withApiSession(request, async () => {
          const active = await getActiveShift();
          const past = await listPastShifts();
          return Response.json({ active, past });
        }),
      POST: ({ request }) =>
        withApiSession(request, async (session) => {
          const body = await readJson(request);
          const input = openShiftSchema.parse(body);
          const shift = await openShift(input, session.user.id);
          return Response.json({ data: shift }, { status: 201 });
        }),
    },
  },
});
