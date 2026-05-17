"use client";
import { useEffect, useState } from "react";
type Theme = "light" | "dark";
function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "dark" ? "dark" : "light";
}
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Initial sync
    Promise.resolve().then(() => setThemeState(readTheme()));
    Promise.resolve().then(() => setMounted(true));
    // Watch the html element for data-theme changes
    const observer = new MutationObserver(() => {
      setThemeState(readTheme());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);
  const setTheme = (next: Theme) => {
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* ignore */
    }
    // No need to call setThemeState — the MutationObserver will fire
  };
  const toggle = () => setTheme(theme === "light" ? "dark" : "light");
  return { theme, setTheme, toggle, mounted };
}