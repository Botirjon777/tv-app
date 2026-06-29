// Builds the copy-paste setup message an admin sends to a hotel manager so they
// can connect their Telegram staff group. Pure string builder — usable on both
// server and client.

export function botUsername(): string {
  return (
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(/^@/, "") ||
    "hotel_menu_orders_bot"
  );
}

export function buildManagerGuide(opts: {
  hotelName: string;
  connectCode: string;
  posPassword: string;
  baseUrl: string;
}): string {
  const { hotelName, connectCode, posPassword, baseUrl } = opts;
  const bot = botUsername();
  return [
    `🏨 ${hotelName} — order bot setup`,
    ``,
    `1. In Telegram, add this bot to your staff group:`,
    `   @${bot}`,
    `2. Make the bot an administrator of the group.`,
    `3. Send this code as a message in the group:  ${connectCode}`,
    `   → the bot replies "✅ Connected to ${hotelName}".`,
    ``,
    `That's it — every new room order will be posted to your group.`,
    ``,
    `Kitchen POS screen (optional):`,
    `• Open ${baseUrl}/pos`,
    `• Hotel code: ${connectCode}`,
    `• Password:   ${posPassword}`,
  ].join("\n");
}
