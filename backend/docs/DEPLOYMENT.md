# VPS Deployment Guide

Deploy the backend to a bare Ubuntu VPS with Docker Compose, TLS, Postgres, and
Redis. Everything runs in containers; only Caddy is exposed to the internet.

## What you get

`docker-compose.prod.yml` brings up four services:

- **caddy** — TLS termination (automatic Let's Encrypt) + reverse proxy, ports 80/443.
- **backend** — this API (non-root, health-checked, resource-limited).
- **postgres** — PostgreSQL 16, internal only, migrations applied on boot.
- **redis** — Redis 7, internal only, memory-capped.

## Prerequisites

- An Ubuntu 22.04+ VPS with a public IP.
- A domain name with a DNS **A/AAAA record** pointing at the VPS
  (e.g. `api.yourhotel.com`). Caddy needs this to issue a certificate.
- Ports **80** and **443** open in the firewall.

## 1. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"    # then log out/in
```

## 2. Get the code

```bash
git clone <your-repo-url> hotel-tv && cd hotel-tv/backend
```

## 3. Configure secrets

```bash
cp .env.production.example .env
npm run gen:secrets                       # or: docker run --rm node:20-slim node -e "..."
npm run hash:password -- 'your-admin-password'
```
Edit `.env` and set at minimum:

- `APP_DOMAIN` and `PUBLIC_BASE_URL` (your domain)
- `CORS_ORIGIN` (admin panel / menu origins — **not** `*`)
- `POSTGRES_PASSWORD` (long random)
- `JWT_SECRET`, `INTERNAL_API_KEY`, `EXELY_WEBHOOK_SECRET` (from `gen:secrets`)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (from `hash:password`)

> `npm run gen:secrets` / `hash:password` need Node locally. If you don't have it,
> run them inside a throwaway container, or generate with
> `openssl rand -hex 48` and a bcrypt tool.

## 4. Launch

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

On first boot the backend runs `prisma migrate deploy` automatically, then
starts. Caddy obtains the TLS certificate within a few seconds (needs DNS +
ports 80/443 reachable).

## 5. Verify

```bash
curl https://api.yourhotel.com/health        # {"status":"ok",...}
docker compose -f docker-compose.prod.yml ps  # all healthy
docker compose -f docker-compose.prod.yml logs -f backend
```

Point the Android TV / admin / hotel-menu clients at
`https://api.yourhotel.com/api/v1`.

## Operations

### Update to a new version
```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```
Migrations apply automatically on the new container's start.

### Logs
```bash
docker compose -f docker-compose.prod.yml logs -f backend
```
Log rotation (10 MB × 5 files per service) is configured in the compose file.

### Database backup
```bash
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > backup-$(date +%F).sql.gz
```
Automate this with cron and copy the dump off-box. Restore with `psql`.

### Media backup
Uploaded media lives in the `media_data` volume (`/data/uploads`). Back it up
with `docker run --rm -v backend_media_data:/data -v $PWD:/out alpine tar czf /out/media.tgz /data`.

### Restart / stop
```bash
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml down          # stop (keeps volumes)
```

## Firewall (recommended)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80,443/tcp
sudo ufw enable
```
Postgres/Redis are **not** published to the host, so they stay off the internet.

## Alternative: your own reverse proxy

If you already run nginx/Traefik on the host, drop the `caddy` service and add a
localhost port mapping to the backend:

```yaml
  backend:
    ports:
      - "127.0.0.1:3000:3000"
```
Then proxy your existing TLS front-end to `127.0.0.1:3000` and forward
`X-Forwarded-Proto` / `X-Forwarded-For` (the app has `trustProxy` on).

## Railway (managed alternative)

`railway.json` + `.env.railway` are provided for Railway. It builds the same
Dockerfile and uses `/health` as the healthcheck; Postgres/Redis are Railway
plugins wired via reference variables. TLS and the proxy are handled by Railway.

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| Backend exits immediately with a config list | A required env var is missing/invalid — read the printed lines. |
| Caddy can't get a cert | DNS not pointing at the VPS yet, or 80/443 blocked. |
| `500` on webhook | `EXELY_WEBHOOK_SECRET` mismatch, or signature header missing. |
| `503` on `/menu/data/*` | `INTERNAL_API_KEY` not set (bridge disabled by design). |
| Admin login `503` | `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` not set. |
