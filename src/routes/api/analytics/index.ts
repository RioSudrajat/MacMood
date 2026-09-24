import { createFileRoute } from "@tanstack/react-router";
import { withApiSession } from "@/lib/api.server";
import { getExecutiveAnalytics } from "@/services/analytics.service.server";

export const Route = createFileRoute("/api/analytics/")({
  server: {
    handlers: {
      GET: ({ request }) =>
        withApiSession(request, async () => {
          const data = await getExecutiveAnalytics();
          return Response.json({ data });
        }),
    },
  },
});
