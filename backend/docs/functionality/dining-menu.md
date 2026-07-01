# Functionality: In-room dining (hotel-menu)

Source: `src/routes/menuApi.ts` (public REST) and `src/routes/menuData.ts`
(internal Prisma bridge). Models: `MenuHotel`, `MenuRoom`, `MenuGuest`,
`Category`, `Product`, `Recommendation`, `Order`, `OrderItem`.

Two ways the dining data is accessed:

## 1. Public REST API (`menuApi.ts`)
Shaped for the Android TV Retrofit client. Responses use the envelope
`{ data, code, message }`.

- **Catalog**: `GET /menu/hotels`, `GET /menu/categories`,
  `GET /menu/products?categoryId=&availableOnly=1`. i18n columns are stored as
  JSON strings and parsed into objects in the response.
- **Guest**: `GET /menu/guest?hotelSlug=&roomNumber=` returns the currently
  checked-in guest (for the welcome screen). `POST /menu/guest` checks a guest in
  for N days. `POST /menu/guest/language` saves their preferred TV language.
- **Orders**:
  - `POST /menu/orders` — place an order. The room is upserted from the free-text
    room number; product name + price are **snapshotted** at order time; total is
    computed server-side; unavailable products → `409`.
  - `GET /menu/orders?hotelSlug=&roomNumber=&active=1` — a room's orders (active or
    history, capped at 100).
  - `GET /menu/orders/:id` — one order for the tracking screen.
  - `PUT /menu/orders/:id` — edit items, allowed **only while `PENDING`** (before
    the kitchen starts). Re-snapshots prices.
- Order status lifecycle: `PENDING → PREPARING → READY → DELIVERED` (or
  `CANCELLED`). Kitchen/POS transitions happen through the data bridge below.

All bodies are Zod-validated. These endpoints are public (guest-facing) and
covered by the global rate limit.

## 2. Internal Prisma bridge (`menuData.ts`)
`POST /api/v1/menu/data/:model/:op` lets the hotel-menu Next.js server run its
existing Prisma calls against this backend's Postgres instead of its own SQLite.
The app's `lib/prisma.ts` forwards each `model.operation(args)` here and the same
Prisma engine executes it — so `where`/`include`/`orderBy`/nested-create/`_count`
semantics are identical.

- Only mapped models (`category, product, recommendation, hotel→menuHotel,
  room→menuRoom, order, orderItem`) and a fixed op allowlist are permitted.
- **Requires** `X-Internal-Key`; **fails closed** (503) if `INTERNAL_API_KEY` is
  unset. Never expose this route publicly. See [../SECURITY.md](../SECURITY.md).
