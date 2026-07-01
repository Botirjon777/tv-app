# Configuration

All configuration is via environment variables, loaded from `.env` (dotenv) and
**validated once at startup** by `src/config/env.ts` using Zod. If anything is
missing or malformed the process prints the exact problems and exits — the server
never boots in a half-configured state.

Generate secrets quickly:
```bash
npm run gen:secrets                    # JWT_SECRET, INTERNAL_API_KEY, EXELY_WEBHOOK_SECRET
npm run hash:password -- 'my-password' # ADMIN_PASSWORD_HASH
```

## Variables

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `NODE_ENV` | no | `development` | `development` \| `production` \| `test`. Production enables stricter validation (see below). |
| `PORT` | no | `3000` | HTTP port. |
| `HOST` | no | `0.0.0.0` | Bind address. |
| `DATABASE_URL` | **yes** | — | PostgreSQL connection URL. |
| `REDIS_URL` | **yes** | — | Redis URL (pub/sub + weather cache). |
| `JWT_SECRET` | **yes** | — | ≥ 32 chars (64+ recommended). Rejected if it still contains `change_me`. |
| `ADMIN_EMAIL` | prod | — | Admin login email. |
| `ADMIN_PASSWORD_HASH` | prod | — | bcrypt hash of the admin password (`npm run hash:password`). |
| `INTERNAL_API_KEY` | prod | — | ≥ 16 chars. Protects the `/menu/data` Prisma bridge; route is disabled if unset. |
| `EXELY_WEBHOOK_SECRET` | prod | — | HMAC secret for Exely webhook verification. |
| `CORS_ORIGIN` | prod ≠ `*` | `*` | Comma-separated origin allowlist. `*` is **rejected in production**. |
| `OPENWEATHER_API_KEY` | no | — | Weather widget; feature disabled if unset. |
| `TELEGRAM_BOT_TOKEN` | no | — | Telegram notifications; disabled if unset. |
| `TELEGRAM_CHAT_ID` | no | — | Target chat/channel id. |
| `MEDIA_DIR` | no | `uploads` | Directory for uploaded media (mount a volume in prod). |
| `PUBLIC_BASE_URL` | no | `` | Absolute origin used to build media URLs. |
| `MAX_UPLOAD_MB` | no | `50` | Max upload size in MB. |
| `RATE_LIMIT_MAX` | no | `300` | Global requests per IP per window. |
| `RATE_LIMIT_WINDOW` | no | `1 minute` | Global rate-limit window. |

## Production-only requirements

When `NODE_ENV=production`, `loadEnv()` additionally enforces:

- `ADMIN_EMAIL` **and** `ADMIN_PASSWORD_HASH` are set (admin API can never be
  left in the "not configured / 503" state).
- `INTERNAL_API_KEY` is set (the raw Prisma bridge must be authenticated).
- `EXELY_WEBHOOK_SECRET` is set (no unsigned webhooks accepted).
- `CORS_ORIGIN` is an explicit allowlist, not `*`.

These are intentionally hard failures — a misconfigured production deploy stops
immediately instead of exposing an unauthenticated surface.

## Env files in the repo

| File | Purpose |
|------|---------|
| `.env.example` | Local development template. |
| `.env.production.example` | VPS/production template (used with `docker-compose.prod.yml`). |
| `.env.railway` | Railway-specific reference variables. |
| `.env` | **Your real secrets — git-ignored, never commit.** |
