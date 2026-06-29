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
  managerPassword: string;
  baseUrl: string;
}): string {
  const { hotelName, connectCode, posPassword, managerPassword, baseUrl } = opts;
  const bot = botUsername();
  return [
    `🏨 ${hotelName} — setup`,
    ``,
    `Telegram order alerts:`,
    `1. In Telegram, add this bot to your staff group:`,
    `   @${bot}`,
    `2. Make the bot an administrator of the group.`,
    `3. Send this code as a message in the group:  ${connectCode}`,
    `   → the bot replies "✅ Connected to ${hotelName}".`,
    ``,
    `Manager dashboard (set up your menu, prices, services, fees):`,
    `• Open ${baseUrl}/dashboard`,
    `• Hotel code: ${connectCode}`,
    `• Password:   ${managerPassword}`,
    ``,
    `Kitchen POS screen:`,
    `• Open ${baseUrl}/pos`,
    `• Hotel code: ${connectCode}`,
    `• Password:   ${posPassword}`,
  ].join("\n");
}
