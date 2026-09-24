import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected")({
  beforeLoad: ({ context }) => {
    if (!context.session) throw redirect({ to: "/sign-in" });
    return { session: context.session };
  },
  component: ProtectedLayout,
});

function ProtectedLayout() {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-brand-cream-50 text-neutral-900 font-sans selection:bg-brand-yellow-400/40">
      <main id="main-content" className="flex-1 flex flex-col h-full w-full overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
