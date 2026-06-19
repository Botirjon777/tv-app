// Data layer for hotel-menu.
//
// Historically this exported a local PrismaClient backed by SQLite. The app now
// persists through the shared backend (Postgres) instead: every call of the
// form `prisma.<model>.<operation>(args)` is forwarded over HTTP to the
// backend's menu data API, which runs the identical Prisma operation and
// returns the result. Because the same Prisma engine executes the query on the
// far side, semantics (where / include / orderBy / nested create / _count /
// aggregate) are unchanged, so every route handler keeps working as-is.
//
// The exported value intentionally keeps the `prisma` name and the
// `prisma.model.op(args)` shape so no call sites had to change.

const BASE = process.env.MENU_DATA_API_URL ?? "http://localhost:3000/api/v1";
const INTERNAL_KEY = process.env.INTERNAL_API_KEY ?? "";

// Models the app uses (hotel-menu naming). The backend maps hotel/room to its
// MenuHotel/MenuRoom delegates.
const MODELS = [
  "category",
  "product",
  "recommendation",
  "hotel",
  "room",
  "order",
  "orderItem",
] as const;

// Field names that Prisma returns as Date objects. The HTTP round-trip turns
// them into ISO strings, so we revive them — some callers do `.toISOString()`
// or `new Date()` on these and expect real Dates (see lib/serialize.ts).
const DATE_KEYS = new Set([
  "createdAt",
  "updatedAt",
  "displayFrom",
  "displayUntil",
  "lastSeenAt",
]);
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function revive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(revive);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      const v = obj[key];
      if (typeof v === "string" && DATE_KEYS.has(key) && ISO_RE.test(v)) {
        obj[key] = new Date(v);
      } else {
        obj[key] = revive(v);
      }
    }
  }
  return value;
}

async function call(model: string, op: string, args: unknown): Promise<unknown> {
  const res = await fetch(`${BASE}/menu/data/${model}/${op}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(INTERNAL_KEY ? { "x-internal-key": INTERNAL_KEY } : {}),
    },
    body: JSON.stringify(args ?? {}),
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err = new Error(
      json?.error || `Data API ${model}.${op} failed (${res.status})`
    ) as Error & { code?: string };
    if (json?.code) err.code = json.code;
    throw err;
  }
  return revive(json.data);
}

function makeModel(model: string) {
  return new Proxy(
    {},
    {
      get: (_target, op: string) => (args: unknown) => call(model, op, args),
    }
  );
}

// Same shape as a PrismaClient for the subset of models/operations the app uses.
// Typed as `any` because it's a remote shim, not the generated client.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma: any = Object.fromEntries(
  MODELS.map((m) => [m, makeModel(m)])
);
