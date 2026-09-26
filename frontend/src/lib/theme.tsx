import { useCallback, useEffect, useRef, useState } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "estroc-theme";

function documentTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
  root.style.colorScheme = theme;
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(documentTheme);
  const transitionTimer = useRef<number | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") {
      applyTheme(stored);
      setTheme(stored);
      return;
    }

    const preference = window.matchMedia("(prefers-color-scheme: light)");
    const syncWithSystem = (event: MediaQueryListEvent) => {
      const nextTheme: Theme = event.matches ? "light" : "dark";
      applyTheme(nextTheme);
      setTheme(nextTheme);
    };

    preference.addEventListener("change", syncWithSystem);
    return () => preference.removeEventListener("change", syncWithSystem);
  }, []);

  useEffect(() => () => {
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    root.classList.add("theme-changing");
    applyTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
    transitionTimer.current = window.setTimeout(() => root.classList.remove("theme-changing"), 340);
  }, [theme]);

  return { theme, toggleTheme };
}