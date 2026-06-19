# Hotel Menu — In-Room Dining Platform

A full-stack **Next.js 14** app for multi-hotel in-room dining with three surfaces:

| Surface | Route | Audience | Device |
| --- | --- | --- | --- |
| **Guest menu** | `/hotel/[slug]/room/[number]` | Hotel guests (via room QR) | Mobile |
| **Kitchen POS** | `/pos` | Chefs / kitchen staff | Tablet |
| **Admin panel** | `/admin` | Hotel managers | Desktop |

**Multi-hotel:** an admin creates a hotel by entering its name + floors + rooms
per floor; the app **auto-generates the rooms** (floor-based: 101–1xx, 201–2xx…)
and a URL slug, and lets you **download every room's QR code as a single PDF**
for printing. Each room's QR opens `/hotel/[slug]/room/[number]`
(e.g. `/hotel/grand-plaza/room/101`). The **menu (products & categories) is
shared across all hotels**.

Guests browse, build a cart and place an order — which appears **instantly** on
the kitchen POS via Server-Sent Events, scoped to that order's hotel (the POS has
a hotel switcher). Chefs advance orders `New → Preparing → Ready → Delivered`,
and guests watch the status update live. Admins manage hotels, products,
categories and view every order (filterable by hotel).

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS — dark, mobile-first guest UI
- **Prisma** + **SQLite** (zero-config; swap to Postgres by editing `schema.prisma`)
- **Server-Sent Events** for live order push to the POS / admin
- **React Query** for admin data management
- Cookie-based password auth (HMAC-signed) gating `/admin` and `/pos`

## Languages, translation & currency

- **Tri-lingual menu** — guests switch between **English / Русский / Oʻzbekcha** with a
  language toggle; all three translations are sent to the client for instant switching.
- **Auto-translation** — in admin you enter an item in **one** language and pick its
  "Input language"; on save the other two are translated via the **Claude API**
  (`src/lib/translate.ts`, model `claude-opus-4-8`, override with `TRANSLATION_MODEL`).
  Without `ANTHROPIC_API_KEY` set, items are stored untranslated (source text copied) —
  the app keeps working.
- **Currency: UZS (soʻm)** — prices are integer soʻm. Each price shows a live
  **approximate USD** beneath it, using a cached rate from `/api/fx`
  (open.er-api.com, with `FX_FALLBACK_UZS_PER_USD` as the offline fallback).

## Getting started

```bash
cd hotel-menu
npm install
npm run setup     # generate client + create db + seed demo data
npm run dev       # http://localhost:3001
```

`npm run setup` runs `prisma generate && prisma db push && prisma db seed`,
seeding 5 categories, ~18 products and 2 demo hotels (Grand Plaza, Seaside
Resort) with auto-generated rooms.

### Default passwords (set in `.env`)

- Admin: `admin123`
- POS: `kitchen123`

Change `ADMIN_PASSWORD`, `POS_PASSWORD` and `AUTH_SECRET` before deploying.

## How it fits together

```
Guest (mobile)                 Kitchen (tablet)            Manager (desktop)
 /hotel/grand-plaza/room/101      /pos                        /admin
        |  POST /api/orders         ^  SSE: order.created        |  CRUD
        v   {hotelSlug, room}       |   (filtered by hotel)      v
   ┌──────────────────────────  Next.js route handlers  ──────────────────────┐
   │ /api/orders /api/products /api/categories /api/hotels /api/rooms /api/auth │
   │                    publishOrderEvent ──► /api/orders/stream (SSE)          │
   └────────────────────────────────  Prisma  ────────────────────────────────┘
                                     │
                                  SQLite (dev.db)
```

Data model: `Hotel 1─* Room 1─* Order *─* Product` (via `OrderItem` snapshots).
`Category`/`Product` are global (shared menu); room numbers are unique **per
hotel** (`@@unique([hotelId, number])`).

## Key scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Dev server on port 3001 |
| `npm run setup` | Generate client, push schema, seed |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Wipe + reseed the database |
| `npm run build` | Production build |

## Notes & next steps

- The SSE event bus (`src/lib/events.ts`) is single-process. For multi-instance
  deployment, back it with Redis pub/sub — the publish/subscribe surface is the
  same.
- Product images are referenced by URL (paste any image link in the admin form).
  Add file uploads (e.g. S3) if you need hosted images.
- Order status is stored as a string (SQLite has no native enums); valid values
  live in `src/lib/orders.ts`.
- Auth is a simple shared password per role. Swap in per-user accounts later if
  you need staff-level auditing.
