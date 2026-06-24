// Data layer for hotel-menu. It runs in one of two modes:
//
//   • Standalone (default): a local PrismaClient backed by SQLite
//     (prisma/dev.db). No external services needed.
//
//   • Integrated: when MENU_DATA_API_URL is set, every call of the form
//     `prisma.<model>.<operation>(args)` is forwarded over HTTP to the shared
//     backend's menu data API, which runs the identical Prisma operation and
//     returns the result. Because the same Prisma engine executes the query on
//     the far side, semantics (where / include / orderBy / nested create /
//     _count / aggregate) are unchanged, so every route handler works either
//     way.
//
// The exported value keeps the `prisma` name and the `prisma.model.op(args)`
// shape in both modes, so no call sites change.

import { PrismaClient } from "@prisma/client";

const REMOTE_BASE = process.env.MENU_DATA_API_URL;

/* ----------------------------- Standalone mode ---------------------------- */
// Reuse a single PrismaClient across hot reloads in development to avoid
// exhausting database connections.
function createLocalClient(): PrismaClient {
  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
  };
  const client =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}

/* ----------------------------- Integrated mode ---------------------------- */
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

function createRemoteClient(base: string): PrismaClient {
  const internalKey = process.env.INTERNAL_API_KEY ?? "";

  async function call(model: string, op: string, args: unknown): Promise<unknown> {
    const res = await fetch(`${base}/menu/data/${model}/${op}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(internalKey ? { "x-internal-key": internalKey } : {}),
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

  // The shim only implements the subset of models/operations the app uses, so
  // we present it as a PrismaClient to keep call sites typed.
  return Object.fromEntries(
    MODELS.map((m) => [m, makeModel(m)])
  ) as unknown as PrismaClient;
}

export const prisma: PrismaClient = REMOTE_BASE
  ? createRemoteClient(REMOTE_BASE)
  : createLocalClient();
