import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Lenis from "lenis";

/**
 * Lenis owns the scroll position, so `scrollIntoView` and `scrollTo` from the
 * platform fight it. Every in-page jump goes through this context instead.
 * Falls back to native scrolling when motion is reduced or Lenis never started.
 */
const LenisContext = createContext<Lenis | null>(null);

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const instance = new Lenis({
      duration: 1.05,
      // Gentle exponential ease-out: fast pickup, long settle. No overshoot.
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.6,
    });
    setLenis(instance);

    const raf = (time: number) => {
      instance.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    };
    rafRef.current = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafRef.current);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}

export function useScrollTo() {
  const lenis = useContext(LenisContext);

  return (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    if (lenis) {
      // Clear the fixed 72px header so anchored headings are not tucked under it.
      lenis.scrollTo(target, { offset: -72 });
      return;
    }
    target.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
}
