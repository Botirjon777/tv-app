import { prisma } from "@/lib/prisma";
import { sendMessage, setupInstructions } from "@/lib/telegram";

// Telegram webhook. Register it once with:
//   curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
//     -d url="https://<your-domain>/api/telegram/webhook" \
//     -d secret_token="<TELEGRAM_WEBHOOK_SECRET>"
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";

export async function POST(req: Request) {
  // Verify Telegram's secret header when configured.
  if (WEBHOOK_SECRET) {
    const got = req.headers.get("x-telegram-bot-api-secret-token");
    if (got !== WEBHOOK_SECRET) {
      return new Response("forbidden", { status: 403 });
    }
  }

  const update = await req.json().catch(() => null);
  const msg = update?.message ?? update?.edited_message;
  const chat = msg?.chat;
  const text: string = typeof msg?.text === "string" ? msg.text.trim() : "";

  // Always 200 to Telegram so it doesn't retry; we just no-op on irrelevant updates.
  if (!chat || !text) return Response.json({ ok: true });

  const chatId = chat.id as number;
  const chatType = chat.type as string;

  // /start in a private chat → setup instructions for the manager.
  if (chatType === "private" && /^\/start\b/.test(text)) {
    await sendMessage(chatId, setupInstructions());
    return Response.json({ ok: true });
  }

  // In a group/supergroup, a bare connect code links that group to the hotel.
  if (chatType === "group" || chatType === "supergroup") {
    const code = text.replace(/\D/g, "");
    if (code.length >= 4) {
      const hotel = await prisma.hotel.findUnique({
        where: { connectCode: code },
      });
      if (hotel) {
        await prisma.hotel.update({
          where: { id: hotel.id },
          data: { telegramChatId: String(chatId) },
        });
        await sendMessage(
          chatId,
          `✅ Connected to <b>${hotel.name}</b>. New orders will appear here.`
        );
      }
    }
  }

  return Response.json({ ok: true });
}
