/* Telegram notifications.
 *
 * Sends a message to a Telegram chat whenever something staff should see
 * happens (a new guest service request, a status change, …). Configuration is
 * via env — when unset, the service no-ops and just logs, so the rest of the
 * app keeps working without Telegram wired up (mirrors the optional-API-key
 * pattern used elsewhere).
 *
 *   TELEGRAM_BOT_TOKEN   the bot token from @BotFather
 *   TELEGRAM_CHAT_ID     the chat/channel id to post into (e.g. -1001234567890)
 *
 * To get these: create a bot with @BotFather, add it to a group/channel, and
 * read the chat id from https://api.telegram.org/bot<token>/getUpdates.
 */
import type { FastifyBaseLogger } from 'fastify';

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

/**
 * Send a Telegram message. Never throws — failures are logged and swallowed so
 * a notification problem can't break the request that triggered it.
 */
export async function sendTelegram(
  text: string,
  log?: FastifyBaseLogger,
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    log?.info({ telegram: 'unconfigured' }, `Telegram not configured; would send: ${text}`);
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      log?.warn({ status: res.status, body }, 'Telegram sendMessage failed');
      return false;
    }
    return true;
  } catch (err) {
    log?.warn({ err }, 'Telegram sendMessage threw');
    return false;
  }
}

/** Human-readable label for a service-request type. */
export function requestTypeLabel(type: string): string {
  switch (type.toUpperCase()) {
    case 'ALARM':
      return '⏰ Alarm / wake-up';
    case 'SERVICE':
      return '🧹 Service request';
    case 'RECEPTION':
      return '🛎️ Reception call';
    case 'TAXI':
      return '🚕 Taxi request';
    case 'PROBLEM':
      return '⚠️ Reported problem';
    default:
      return type;
  }
}

/** Format a service request as a Telegram HTML message. */
export function formatRequestMessage(req: {
  type: string;
  hotelName: string;
  roomNumber: string;
  guestName?: string;
  note?: string;
  source?: string;
}): string {
  const lines = [
    `<b>${requestTypeLabel(req.type)}</b>`,
    `🏨 ${escapeHtml(req.hotelName)}`,
    `🚪 Room <b>${escapeHtml(req.roomNumber)}</b>`,
  ];
  if (req.guestName) lines.push(`👤 ${escapeHtml(req.guestName)}`);
  if (req.note) lines.push(`📝 ${escapeHtml(req.note)}`);
  if (req.source) lines.push(`<i>via ${escapeHtml(req.source)}</i>`);
  return lines.join('\n');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
