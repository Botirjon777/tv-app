"use client";

import { useEffect, useState } from "react";
import { DEFAULT_LANG, isLang, type Lang } from "@/lib/i18n";

const LANG_KEY = "hotel-menu-lang";

// Guest's chosen menu language, persisted in localStorage so it carries across
// the landing and menu routes.
export function useLang() {
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && isLang(saved)) setLang(saved);
  }, []);

  const changeLang = (next: Lang) => {
    setLang(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* ignore */
    }
  };

  return { lang, changeLang };
}
