import type { ReactNode } from "react";
import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  useRouter,
} from "@tanstack/react-router";
import { siteConfig } from "@/config/site";
import { Providers } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { getSessionFn } from "@/lib/session";
import globalsCss from "@/styles/globals.css?url";

export const Route = createRootRoute({
  // One session read per navigation, shared with every route as context.
  beforeLoad: async () => ({ session: await getSessionFn() }),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: `${siteConfig.name} — Mood baik, dimulai dari MacMood` },
      { name: "description", content: siteConfig.description },
      { name: "theme-color", content: "#194735" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..800;1,9..40,400..800&family=Inter:ital,opsz,wght@0,14..32,300..800;1,14..32,300..800&family=Manrope:wght@500;600;700;800&display=swap",
      },
      { rel: "stylesheet", href: globalsCss },
      { rel: "icon", href: "/assets/macmood-logo.png", type: "image/png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/assets/macmood-logo.png" },
    ],
    scripts: [
      {
        type: "module",
        src: "https://ajax.googleapis.com/ajax/libs/model-viewer/4.3.1/model-viewer.min.js",
      },
    ],
  }),
  shellComponent: RootDocument,
  component: Outlet,
  notFoundComponent: NotFound,
  errorComponent: ErrorPage,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body className="bg-brand-cream-50 text-neutral-900 antialiased selection:bg-brand-yellow-400/40">
        <Providers>
          <a
            href="#main-content"
            className="sr-only z-50 rounded-md bg-brand-green-950 p-3 text-brand-cream-50 focus:not-sr-only focus:fixed focus:top-4 focus:left-4 font-bold"
          >
            Lewati ke konten utama
          </a>
          {children}
        </Providers>
        <Scripts />
      </body>
    </html>
  );
}

function NotFound() {
  return (
    <main id="main-content" className="mx-auto max-w-lg px-6 py-24 text-center">
      <p className="mb-3 font-mono text-sm font-bold text-brand-coral-600">404</p>
      <h1 className="text-3xl font-bold tracking-tight font-display text-brand-green-950">
        Halaman tidak ditemukan
      </h1>
      <p className="my-4 text-neutral-600">
        Halaman yang Anda tuju belum tersedia atau telah dipindahkan.
      </p>
      <div className="flex justify-center gap-3">
        <Button asChild className="bg-brand-green-800 text-brand-cream-50 hover:bg-brand-green-900">
          <Link to="/">Ke Beranda</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/app">Buka POS Kasir</Link>
        </Button>
      </div>
    </main>
  );
}

function ErrorPage() {
  const router = useRouter();
  return (
    <main id="main-content" className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="text-2xl font-bold font-display text-brand-green-950">Terjadi kesalahan</h1>
      <p className="my-4 leading-7 text-neutral-600">
        Sistem mengalami kendala saat memuat data. Silakan muat ulang halaman atau periksa koneksi.
      </p>
      <Button
        onClick={() => router.invalidate()}
        className="bg-brand-green-800 text-brand-cream-50 hover:bg-brand-green-900"
      >
        Coba Lagi
      </Button>
    </main>
  );
}
