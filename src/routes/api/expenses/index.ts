import { createFileRoute } from "@tanstack/react-router";
import { readJson, withApiSession } from "@/lib/api.server";
import { createExpense, listExpenses } from "@/services/expenses.service.server";
import { createExpenseSchema } from "@/validators/expenses";

export const Route = createFileRoute("/api/expenses/")({
  server: {
    handlers: {
      GET: ({ request }) =>
        withApiSession(request, async () => {
          const url = new URL(request.url);
          const branchId = url.searchParams.get("branchId") || undefined;
          const data = await listExpenses(branchId);
          return Response.json({ data });
        }),

      POST: ({ request }) =>
        withApiSession(request, async (session) => {
          const body = await readJson(request);
          const input = createExpenseSchema.parse(body);
          const expense = await createExpense(input, session.user.id);
          return Response.json({ data: expense }, { status: 201 });
        }),
    },
  },
});
