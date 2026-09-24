import { createFileRoute } from "@tanstack/react-router";
import { withApiSession } from "@/lib/api.server";
import { listAuditLogs } from "@/services/audit.service.server";

export const Route = createFileRoute("/api/audit-logs/")({
  server: {
    handlers: {
      GET: ({ request }) =>
        withApiSession(request, async () => {
          const url = new URL(request.url);
          const limit = Number(url.searchParams.get("limit")) || 100;
          const data = await listAuditLogs(limit);
          return Response.json({ data });
        }),
    },
  },
});
