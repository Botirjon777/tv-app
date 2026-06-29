import { prisma } from "@/lib/prisma";
import {
  sendMessage,
  setupInstructions,
  TOPIC_KEYWORDS,
  TOPIC_LABELS,
} from "@/lib/telegram";

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
  const threadId: number | undefined =
    typeof msg?.message_thread_id === "number" ? msg.message_thread_id : undefined;

  // /start in a private chat → setup instructions for the manager.
  if (chatType === "private" && /^\/start\b/.test(text)) {
    await sendMessage(chatId, setupInstructions());
    return Response.json({ ok: true });
  }

  if (chatType === "group" || chatType === "supergroup") {
    // A bare connect code links the whole group to the hotel.
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
          `✅ Connected to <b>${hotel.name}</b>. New orders will appear here.`,
          threadId
        );
      }
      return Response.json({ ok: true });
    }

    // A keyword sent inside a topic binds that topic to a category.
    const topicKey = TOPIC_KEYWORDS[text.toLowerCase()];
    if (topicKey && threadId) {
      const hotel = await prisma.hotel.findFirst({
        where: { telegramChatId: String(chatId) },
      });
      if (hotel) {
        const topics = (() => {
          try {
            const o = JSON.parse(hotel.telegramTopics);
            return o && typeof o === "object" ? o : {};
          } catch {
            return {};
          }
        })();
        topics[topicKey] = threadId;
        await prisma.hotel.update({
          where: { id: hotel.id },
          data: { telegramTopics: JSON.stringify(topics) },
        });
        await sendMessage(
          chatId,
          `✅ This topic will receive <b>${TOPIC_LABELS[topicKey]}</b>.`,
          threadId
        );
      }
    }
  }

  return Response.json({ ok: true });
}
