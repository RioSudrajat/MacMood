import { useState } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

interface SignOutButtonProps {
  variant?: "default" | "sidebar";
  collapsed?: boolean;
  className?: string;
}

export function SignOutButton({
  variant = "default",
  collapsed = false,
  className = "",
}: SignOutButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();
  const navigate = useNavigate();

  async function signOut() {
    setPending(true);
    setError(false);
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error("Sign out failed");
      await router.invalidate();
      await navigate({ to: "/sign-in", replace: true });
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  if (variant === "sidebar") {
    if (collapsed) {
      return (
        <button
          type="button"
          onClick={signOut}
          disabled={pending}
          title="Sign out"
          aria-label="Sign out"
          className={`size-11 rounded-2xl bg-neutral-100 hover:bg-rose-100 text-neutral-600 hover:text-rose-700 flex items-center justify-center transition-colors cursor-pointer ${className}`}
        >
          <LogOut className="size-4.5" />
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={signOut}
        disabled={pending}
        aria-label="Sign out"
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-neutral-100 hover:bg-rose-50 text-neutral-700 hover:text-rose-700 font-bold text-xs transition-colors cursor-pointer ${className}`}
      >
        <LogOut className="size-4 text-neutral-500" />
        <span>{pending ? "Signing out…" : "Sign out"}</span>
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          Couldn’t sign out. Try again.
        </p>
      )}
      <Button
        onClick={signOut}
        disabled={pending}
        variant="outline"
        size="sm"
        className={className}
      >
        <LogOut aria-hidden="true" />
        {pending ? "Signing out…" : "Sign out"}
      </Button>
    </div>
  );
}
