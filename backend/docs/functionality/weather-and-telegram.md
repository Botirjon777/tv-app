# Functionality: Weather & Telegram (optional integrations)

Both degrade gracefully: if their env vars are unset the feature simply no-ops and
the rest of the app keeps working.

## Weather — `src/services/weatherService.ts`

Shows current conditions on the TV welcome screen.

- Called from `GET /room/config` with the hotel's `city` + `countryCode`.
- **Caching**: results are cached in the `WeatherCache` table keyed by
  `city,country` for **15 minutes**, so OpenWeatherMap is hit at most a few times
  an hour regardless of how many TVs poll.
- **Fetch**: `https://api.openweathermap.org/data/2.5/weather` with
  `OPENWEATHER_API_KEY`. City/country are URL-encoded.
- **Fallbacks**: no API key → returns `null` (widget hidden). On a fetch error, the
  last cached value is returned if present.

Config: `OPENWEATHER_API_KEY` (optional).

## Telegram — `src/services/telegramService.ts`

Notifies staff of guest service requests.

- `sendTelegram(text, log)` posts to the Bot API `sendMessage`. It **never
  throws** — failures are logged and swallowed so a notification problem can't
  break the request that triggered it (it's called fire-and-forget).
- Messages are HTML with an emoji per request type; all guest-supplied fields are
  HTML-escaped.

Config: `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` (both optional). When unset the
service logs "would send: …" instead of calling Telegram.
