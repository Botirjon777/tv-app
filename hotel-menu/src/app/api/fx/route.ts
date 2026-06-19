import { ok } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// In-memory cache of the USD→UZS rate (refreshed at most hourly).
const globalForFx = globalThis as unknown as {
  fxCache?: { uzsPerUsd: number; fetchedAt: number };
};

const ONE_HOUR = 60 * 60 * 1000;

function fallbackRate(): number {
  const env = Number(process.env.FX_FALLBACK_UZS_PER_USD);
  return env && env > 0 ? env : 12900;
}

// GET /api/fx — approximate UZS per 1 USD, with the timestamp of the rate.
export async function GET() {
  const cached = globalForFx.fxCache;
  if (cached && Date.now() - cached.fetchedAt < ONE_HOUR) {
    return ok({ uzsPerUsd: cached.uzsPerUsd, cached: true });
  }

  let uzsPerUsd = fallbackRate();
  let live = false;
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const rate = data?.rates?.UZS;
      if (typeof rate === "number" && rate > 0) {
        uzsPerUsd = rate;
        live = true;
      }
    }
  } catch {
    /* fall back to the configured rate */
  }

  globalForFx.fxCache = { uzsPerUsd, fetchedAt: Date.now() };
  return ok({ uzsPerUsd, live });
}
