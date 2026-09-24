import { createFileRoute } from "@tanstack/react-router";
import { readJson, withApiSession } from "@/lib/api.server";
import { closeShift } from "@/services/pos.service.server";
import { closeShiftSchema } from "@/validators/pos";

export const Route = createFileRoute("/api/pos/shifts/close")({
  server: {
    handlers: {
      POST: ({ request }) =>
        withApiSession(request, async () => {
          const body = (await readJson(request)) as { shiftId: string; actualCash: number; notes?: string };
          if (!body?.shiftId) {
            return Response.json({ error: { code: "MISSING_SHIFT_ID", message: "shiftId is required" } }, { status: 400 });
          }
          const input = closeShiftSchema.parse({
            actualCash: body.actualCash,
            notes: body.notes,
          });
          const shift = await closeShift(body.shiftId, input);
          return Response.json({ data: shift });
        }),
    },
  },
});
