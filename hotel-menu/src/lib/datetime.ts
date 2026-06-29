import type { Lang } from "@/lib/i18n";

export function localeFor(lang: Lang): string {
  return lang === "ru" ? "ru-RU" : lang === "uz" ? "uz-UZ" : "en-GB";
}

// Next `days` calendar days as { YYYY-MM-DD, localized label } for date dropdowns.
export function buildDateOptions(
  lang: Lang,
  days = 14
): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
    out.push({
      value,
      label: d.toLocaleDateString(localeFor(lang), {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
    });
  }
  return out;
}

// 30-minute time slots "HH:MM" for time dropdowns.
export const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    out.push(`${String(h).padStart(2, "0")}:30`);
  }
  return out;
})();
