import { useState, type FormEvent } from "react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowRight, LoaderCircle, ShieldCheck, Store } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { siteConfig } from "@/config/site";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const signingUp = mode === "sign-up";
  const router = useRouter();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleQuickLogin(targetEmail: string, targetPass: string, targetPath: string) {
    if (pending) return;
    setEmail(targetEmail);
    setPassword(targetPass);
    setPending(true);
    setError("");
    try {
      const result = await authClient.signIn.email({
        email: targetEmail,
        password: targetPass,
      });
      if (result.error) {
        setError(result.error.message || "Gagal masuk dengan akun demo.");
        return;
      }
      await router.invalidate();
      await navigate({ to: targetPath, replace: true });
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setPending(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const credentials = {
        email: email.trim(),
        password,
      };
      const result = signingUp
        ? await authClient.signUp.email({
            ...credentials,
            name: String(new FormData(event.currentTarget).get("name") || "").trim(),
          })
        : await authClient.signIn.email(credentials);
      if (result.error) {
        setError(
          signingUp
            ? result.error.message ||
                "We couldn't create your account. Please try again."
            : "We couldn't sign you in. Check your email and password and try again.",
        );
        return;
      }
      // Re-run route guards with the new cookie, then move to the app.
      await router.invalidate();
      await navigate({ to: siteConfig.homePath, replace: true });
    } catch {
      setError(
        "We couldn't reach the server. Check your connection and try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <p className="mb-3 text-sm font-medium text-primary">
        {signingUp ? "A place to begin" : "Good to see you"}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">
        {signingUp ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-3 text-base leading-7 text-muted-foreground">
        {signingUp
          ? "One small step. Then make this app your own."
          : "Sign in to pick up where you left off."}
      </p>

      {/* Quick Demo Login Cards for Owner and Kasir */}
      {!signingUp && (
        <div className="mt-6 p-4 rounded-2xl bg-brand-cream-100/90 border border-brand-green-900/15 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-green-950 flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-brand-green-800" />
              <span>Akses Cepat Demo Akun:</span>
            </span>
            <span className="text-[10px] text-brand-green-900 font-bold px-2 py-0.5 rounded-full bg-brand-yellow-300">
              1-Click Login
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={pending}
              onClick={() => handleQuickLogin("owner@macmood.id", "password123", "/admin")}
              className="p-3 rounded-xl bg-white hover:bg-brand-cream-50 border border-brand-green-900/20 text-left transition-all shadow-2xs hover:shadow-xs cursor-pointer group disabled:opacity-50"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <ShieldCheck className="size-3.5 text-brand-green-800 flex-shrink-0" />
                <span className="text-xs font-black text-brand-green-950 block truncate group-hover:text-brand-green-800">
                  Owner
                </span>
              </div>
              <span className="text-[11px] font-bold text-neutral-800 block truncate">
                Muhammad Afrizal
              </span>
              <span className="text-[10px] text-neutral-500 block truncate">
                owner@macmood.id
              </span>
              <span className="inline-block mt-1.5 text-[9px] font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                Masuk ke /admin
              </span>
            </button>

            <button
              type="button"
              disabled={pending}
              onClick={() => handleQuickLogin("budi.kasir@macmood.id", "password123", "/app")}
              className="p-3 rounded-xl bg-white hover:bg-brand-cream-50 border border-brand-green-900/20 text-left transition-all shadow-2xs hover:shadow-xs cursor-pointer group disabled:opacity-50"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Store className="size-3.5 text-amber-700 flex-shrink-0" />
                <span className="text-xs font-black text-brand-green-950 block truncate group-hover:text-brand-green-800">
                  Kasir POS
                </span>
              </div>
              <span className="text-[11px] font-bold text-neutral-800 block truncate">
                Budi Santoso
              </span>
              <span className="text-[10px] text-neutral-500 block truncate">
                budi.kasir@macmood.id
              </span>
              <span className="inline-block mt-1.5 text-[9px] font-bold text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded">
                Masuk ke /app
              </span>
            </button>
          </div>

          <div className="text-[10px] text-neutral-500 text-center">
            Password kedua akun: <code className="font-mono font-bold text-neutral-800 bg-white px-1.5 py-0.5 rounded border border-neutral-200">password123</code>
          </div>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="mt-6 space-y-5"
        aria-busy={pending}
        aria-describedby={error ? "auth-error" : undefined}
      >
        <fieldset disabled={pending} className="space-y-5">
          <legend className="sr-only">
            {signingUp ? "Account details" : "Sign in details"}
          </legend>
          {signingUp && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                autoComplete="name"
                placeholder="Your name"
                required
                minLength={1}
                maxLength={100}
                pattern=".*\S.*"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={signingUp ? "new-password" : "current-password"}
              required
              minLength={8}
              maxLength={128}
              aria-describedby={signingUp ? "password-hint" : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {signingUp && (
              <p id="password-hint" className="text-sm text-muted-foreground">
                Use at least 8 characters.
              </p>
            )}
          </div>
          {error && (
            <p
              id="auth-error"
              role="alert"
              className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm leading-6 text-destructive"
            >
              {error}
            </p>
          )}
          <Button className="w-full" type="submit" size="lg" disabled={pending}>
            {pending ? (
              <LoaderCircle
                className="animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : null}
            {pending
              ? "Please wait…"
              : signingUp
                ? "Create account"
                : "Sign in"}
            {!pending && <ArrowRight aria-hidden="true" />}
          </Button>
        </fieldset>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {signingUp ? "Already have an account?" : "New here?"}{" "}
        <Link
          className="rounded-sm font-medium text-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
          to={signingUp ? "/sign-in" : "/sign-up"}
        >
          {signingUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
