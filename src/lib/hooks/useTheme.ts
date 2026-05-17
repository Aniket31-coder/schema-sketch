"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function useTheme() {
  // We can't read the DOM during SSR, so the initial state is a guess.
  // After mount, we sync to the actual data-theme attribute that
  // the inline script set during page load.
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") as Theme;
    if (current === "light" || current === "dark") {
      Promise.resolve().then(() => setThemeState(current));
    }
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* localStorage might be disabled — fail silently */
    }
  };

  const toggle = () => setTheme(theme === "light" ? "dark" : "light");

  return { theme, setTheme, toggle };
}
