"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const THEME_KEY = "hotel-menu-theme";

// Light/dark theme, persisted in localStorage and reflected on <html> via the
// Tailwind `dark` class strategy. The guest room routes share the same key, so
// the choice survives navigation between the landing and the menu. A pre-paint
// script in app/[slug]/layout.tsx applies it before hydration to avoid a flash.
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });

  return { theme, toggleTheme };
}
