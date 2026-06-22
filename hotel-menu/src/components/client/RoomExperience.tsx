"use client";

import { useEffect, useState } from "react";
import type { MenuCategoryDTO, ProductDTO } from "@/types";
import { DEFAULT_LANG, isLang, type Lang } from "@/lib/i18n";
import { MenuClient } from "./MenuClient";
import { RoomLanding, type LandingHotel } from "./RoomLanding";

const LANG_KEY = "hotel-menu-lang";

/**
 * Guest in-room experience. Opens on a service "landing" (hotel hero image +
 * service banners + a menu banner); tapping the menu banner reveals the
 * existing dining menu. Language is shared across both views.
 */
export function RoomExperience({
  hotel,
  room,
  menu,
  recommendations = [],
}: {
  hotel: LandingHotel;
  room: { id: string; number: string; name: string };
  menu: MenuCategoryDTO[];
  recommendations?: ProductDTO[];
}) {
  const [view, setView] = useState<"home" | "menu">("home");
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && isLang(saved)) setLang(saved);
  }, []);

  const changeLang = (l: Lang) => {
    setLang(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
  };

  if (view === "menu") {
    return (
      <MenuClient
        hotel={hotel}
        room={room}
        menu={menu}
        recommendations={recommendations}
        lang={lang}
        onChangeLang={changeLang}
        onBack={() => setView("home")}
      />
    );
  }

  return (
    <RoomLanding
      hotel={hotel}
      room={room}
      lang={lang}
      onChangeLang={changeLang}
      onOpenMenu={() => setView("menu")}
    />
  );
}
