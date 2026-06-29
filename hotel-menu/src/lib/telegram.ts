// Telegram bot integration. One bot serves every hotel: a manager links their
// staff group via the hotel's connect code (see /api/telegram/webhook), and new
// orders for that hotel are posted to its group.

import type { OrderDTO } from "@/types";
import { formatPrice } from "./utils";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const API = `https://api.telegram.org/bot${TOKEN}`;

export function telegramEnabled(): boolean {
  return Boolean(TOKEN);
}

// Send an HTML message to a chat. Never throws — returns false on any failure so
// callers (e.g. order creation) are never blocked by Telegram being down.
export async function sendMessage(
  chatId: string | number,
  text: string
): Promise<boolean> {
  if (!TOKEN) return false;
  try {
    const res = await fetch(`${API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Instructions shown when a manager opens the bot (/start, private chat).
export function setupInstructions(): string {
  return [
    "👋 <b>Hotel order bot</b>",
    "",
    "To connect your hotel:",
    "1. Add this bot to your staff group.",
    "2. Make the bot an <b>administrator</b> of that group.",
    "3. Send your hotel's <b>connect code</b> in the group (find it in the admin panel).",
    "",
    "Once linked, every new room order is posted to that group automatically.",
  ].join("\n");
}

// Formats an order for the staff group.
export function formatOrderMessage(order: OrderDTO): string {
  const lines = order.items.map(
    (it) =>
      `• ${it.quantity}× ${escapeHtml(it.name)} — ${formatPrice(
        it.price * it.quantity
      )}`
  );
  const note = order.note ? `\n📝 ${escapeHtml(order.note)}` : "";
  return [
    `🛎 <b>New order</b> · Room <b>${escapeHtml(order.roomNumber)}</b>`,
    "",
    ...lines,
    "",
    `<b>Total: ${formatPrice(order.total)}</b>${note}`,
  ].join("\n");
}
