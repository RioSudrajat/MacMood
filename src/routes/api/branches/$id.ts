import { createFileRoute } from "@tanstack/react-router";
import { readJson, withApiSession } from "@/lib/api.server";
import { deleteBranch, getBranch, updateBranch } from "@/services/branches.service.server";
import { updateBranchSchema } from "@/validators/branches";

export const Route = createFileRoute("/api/branches/$id")({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        withApiSession(request, async () => {
          const branch = await getBranch(params.id);
          if (!branch) {
            return Response.json({ error: "Cabang tidak ditemukan" }, { status: 404 });
          }
          return Response.json({ data: branch });
        }),
      PATCH: ({ request, params }) =>
        withApiSession(request, async (session) => {
          if (session.user.role !== "admin") {
            return Response.json({ error: "Hanya Owner/Admin yang diizinkan mengubah cabang" }, { status: 403 });
          }
          const body = await readJson(request);
          const input = updateBranchSchema.parse(body);
          const updated = await updateBranch(params.id, input);
          if (!updated) {
            return Response.json({ error: "Cabang tidak ditemukan" }, { status: 404 });
          }
          return Response.json({ data: updated });
        }),
      DELETE: ({ request, params }) =>
        withApiSession(request, async (session) => {
          if (session.user.role !== "admin") {
            return Response.json({ error: "Hanya Owner/Admin yang diizinkan menghapus cabang" }, { status: 403 });
          }
          try {
            const deleted = await deleteBranch(params.id);
            if (!deleted) {
              return Response.json({ error: "Cabang tidak ditemukan" }, { status: 404 });
            }
            return Response.json({ data: deleted });
          } catch (err) {
            const message = err instanceof Error ? err.message : "Gagal menghapus cabang";
            return Response.json({ error: message }, { status: 400 });
          }
        }),
    },
  },
});
