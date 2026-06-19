import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Prices are stored as integer UZS (so'm) — no minor units / decimals.
export function formatPrice(uzs: number): string {
  // ru-RU groups thousands with spaces, matching UZS convention: "150 000".
  const value = new Intl.NumberFormat("ru-RU").format(Math.round(uzs ?? 0));
  return `${value} so'm`;
}

// Parse a user-entered price string ("150000" / "150 000") into integer UZS.
export function parsePrice(input: string): number {
  const value = parseInt(String(input).replace(/[^0-9]/g, ""), 10);
  return Number.isNaN(value) ? 0 : value;
}

// Approximate USD for a UZS amount given the current rate (UZS per 1 USD).
export function approxUsd(uzs: number, uzsPerUsd: number): string {
  if (!uzsPerUsd || uzsPerUsd <= 0) return "";
  const usd = uzs / uzsPerUsd;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(usd);
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Human "x minutes ago" used on the POS to show how long an order has waited.
export function minutesAgo(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
}
