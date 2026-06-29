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

const REQUEST_LABELS: Record<string, string> = {
  ALARM: "Wake-up call",
  SERVICE: "Service request",
  TAXI: "Taxi",
  RECEPTION: "Reception call",
  PROBLEM: "Problem report",
};

// Formats a guest service request (taxi / alarm / …) for the staff group.
export function formatRequestMessage(req: {
  type: string;
  roomNumber: string;
  destination?: string;
  scheduledFor?: string | null;
  note?: string;
  guestName?: string;
}): string {
  const label = REQUEST_LABELS[req.type] ?? req.type;
  const lines = [
    `🔔 <b>${label}</b> · Room <b>${escapeHtml(req.roomNumber)}</b>`,
  ];
  if (req.destination) lines.push(`📍 ${escapeHtml(req.destination)}`);
  if (req.scheduledFor) {
    const when = new Date(req.scheduledFor);
    if (!Number.isNaN(when.getTime())) {
      lines.push(
        `🕒 ${when.toLocaleString("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        })}`
      );
    }
  }
  if (req.note) lines.push(`📝 ${escapeHtml(req.note)}`);
  if (req.guestName) lines.push(`👤 ${escapeHtml(req.guestName)}`);
  return lines.join("\n");
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
  const feeLine =
    order.serviceFee > 0 ? [`Service fee: ${formatPrice(order.serviceFee)}`] : [];
  return [
    `🛎 <b>New order</b> · Room <b>${escapeHtml(order.roomNumber)}</b>`,
    "",
    ...lines,
    "",
    ...feeLine,
    `<b>Total: ${formatPrice(order.total)}</b>${note}`,
  ].join("\n");
}
