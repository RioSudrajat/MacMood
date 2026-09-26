import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "@tanstack/react-router";
import Lenis from "lenis";

const LenisContext = createContext<Lenis | null>(null);

export function useLenis() {
  return useContext(LenisContext);
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null);
  const location = useLocation();
  const lenisRef = useRef<Lenis | null>(null);

  const isLandingPage = location.pathname === "/";

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Only activate Lenis on the landing page (document-level scroll)
    // Non-landing pages (like POS Kasir /app and Admin /admin) have fixed viewport panels
    // with internal overflow-y-auto that must scroll with native wheel events.
    if (!isLandingPage) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
        setLenisInstance(null);
        delete (window as unknown as { __lenis?: Lenis }).__lenis;
        document.documentElement.classList.remove("lenis", "lenis-smooth");
      }
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    // Initialize Lenis with luxurious, elegant deceleration
    const lenis = new Lenis({
      autoRaf: true,
      duration: 1.2, // Elegant smooth momentum duration
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential deceleration curve
      smoothWheel: !prefersReducedMotion.matches,
      syncTouch: false, // Keep native touch momentum on smartphones for optimal performance
      wheelMultiplier: 1.0,
      touchMultiplier: 1.0,
      infinite: false,
    });

    lenisRef.current = lenis;
    queueMicrotask(() => {
      setLenisInstance(lenis);
    });
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    const onMotionPreferenceChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        lenis.stop();
      } else {
        lenis.start();
      }
    };

    prefersReducedMotion.addEventListener?.("change", onMotionPreferenceChange);

    // Global anchor click handler for smooth scrolling to in-page hash links
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Handle in-page anchors
      if (href.startsWith("#")) {
        if (target.getAttribute("target") === "_blank") return;

        if (href === "#" || href === "#hero") {
          e.preventDefault();
          lenis.scrollTo(0, { duration: 1.2 });
          try {
            history.pushState(null, "", window.location.pathname);
          } catch {
            void 0;
          }
          return;
        }

        const targetElement = document.querySelector(href);
        if (targetElement) {
          e.preventDefault();
          const header = document.querySelector(".site-header");
          const headerHeight = header
            ? header.getBoundingClientRect().height
            : 80;
          lenis.scrollTo(targetElement as HTMLElement, {
            offset: -headerHeight - 8,
            duration: 1.2,
          });
          try {
            history.pushState(null, "", href);
          } catch {
            void 0;
          }
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);

    return () => {
      document.removeEventListener("click", handleAnchorClick);
      prefersReducedMotion.removeEventListener?.(
        "change",
        onMotionPreferenceChange,
      );
      lenis.destroy();
      lenisRef.current = null;
      setLenisInstance(null);
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
      document.documentElement.classList.remove("lenis", "lenis-smooth");
    };
  }, [isLandingPage]);

  // Reset scroll on route change if not a hash navigation
  useEffect(() => {
    if (lenisRef.current && isLandingPage && !location.hash) {
      lenisRef.current.scrollTo(0, { immediate: true });
    }
  }, [location.pathname, location.hash, isLandingPage]);

  return (
    <LenisContext.Provider value={lenisInstance}>
      {children}
    </LenisContext.Provider>
  );
}
