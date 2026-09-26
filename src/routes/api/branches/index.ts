import { createFileRoute } from "@tanstack/react-router";
import { readJson, withApiSession } from "@/lib/api.server";
import { createBranch, listBranches } from "@/services/branches.service.server";
import { branchInputSchema } from "@/validators/branches";

export const Route = createFileRoute("/api/branches/")({
  server: {
    handlers: {
      GET: ({ request }) =>
        withApiSession(request, async () => {
          const data = await listBranches();
          return Response.json({ data });
        }),
      POST: ({ request }) =>
        withApiSession(request, async (session) => {
          if (session.user.role !== "admin") {
            return Response.json(
              { error: "Hanya Owner/Admin yang diizinkan menambah cabang" },
              { status: 403 },
            );
          }
          const body = await readJson(request);
          const input = branchInputSchema.parse(body);
          const branch = await createBranch(input);
          return Response.json({ data: branch }, { status: 201 });
        }),
    },
  },
});
