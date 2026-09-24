import { createFileRoute } from "@tanstack/react-router";
import { readJson, withApiSession } from "@/lib/api.server";
import { createProduct, listProducts } from "@/services/catalog.service.server";
import { createProductSchema } from "@/validators/catalog";

export const Route = createFileRoute("/api/catalog/products/")({
  server: {
    handlers: {
      GET: ({ request }) =>
        withApiSession(request, async () => {
          const url = new URL(request.url);
          const categorySlug = url.searchParams.get("category") || undefined;
          const data = await listProducts({ categorySlug });
          return Response.json({ data });
        }),
      POST: ({ request }) =>
        withApiSession(request, async () => {
          const body = await readJson(request);
          const input = createProductSchema.parse(body);
          const product = await createProduct(input);
          return Response.json({ data: product }, { status: 201 });
        }),
    },
  },
});
