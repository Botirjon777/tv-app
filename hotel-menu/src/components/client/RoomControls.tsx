"use client";

import { Moon, Sun } from "lucide-react";
import { Dropdown, type DropdownOption } from "@/components/ui";
import { LANGS, LANG_LABEL, LANG_SHORT, t, type Lang } from "@/lib/i18n";
import type { Theme } from "./useTheme";

const LANG_OPTIONS: DropdownOption<Lang>[] = LANGS.map((l) => ({
  value: l,
  label: LANG_LABEL[l],
  triggerLabel: LANG_SHORT[l],
}));

// Shared top-bar controls for the guest room routes: a language dropdown and a
// light/dark theme toggle. Both the landing and the menu render this.
export function RoomControls({
  lang,
  onChangeLang,
  theme,
  onToggleTheme,
  align = "start",
}: {
  lang: Lang;
  onChangeLang: (l: Lang) => void;
  theme: Theme;
  onToggleTheme: () => void;
  align?: "start" | "end";
}) {
  return (
    <div className="flex items-center gap-2">
      <Dropdown
        value={lang}
        options={LANG_OPTIONS}
        onChange={onChangeLang}
        align={align}
        label="Language"
      />
      <button
        onClick={onToggleTheme}
        aria-label={theme === "dark" ? t(lang, "lightMode") : t(lang, "darkMode")}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-white"
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
