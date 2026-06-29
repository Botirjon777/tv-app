"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import { CenteredSpinner } from "@/components/ui";
import {
  useProducts,
  useRecommendations,
  useRecommendationMutations,
} from "@/hooks/dashboard";
import type { RecommendationDTO } from "@/types";

// 0 = Sunday … 6 = Saturday (matches Date.getDay()). Shown Monday-first.
const DAYS: { value: number; label: string }[] = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

export default function RecommendationsPage() {
  const { data: recs = [], isLoading: recsLoading } = useRecommendations();
  const { data: products = [], isLoading: prodLoading } = useProducts();
  const { create, remove: removeRec } = useRecommendationMutations();
  const busy = create.isPending || removeRec.isPending;

  const byDay = useMemo(() => {
    const map: Record<number, RecommendationDTO[]> = {};
    for (const r of recs) (map[r.dayOfWeek] ??= []).push(r);
    return map;
  }, [recs]);

  const add = (dayOfWeek: number, productId: string) => {
    if (!productId) return;
    create.mutate(
      { dayOfWeek, productId },
      { onError: (e) => alert(e instanceof Error ? e.message : "Failed to add") }
    );
  };

  const remove = (id: string) => removeRec.mutate(id);

  if (recsLoading || prodLoading) return <CenteredSpinner label="Loading…" />;

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold text-slate-900">Recommendation of the day</h2>
      <p className="mt-1 text-sm text-slate-500">
        Feature a few dishes per weekday — guests see them at the top of the menu.
      </p>

      {products.length === 0 ? (
        <p className="mt-5 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          Add some products first, then feature them here.
        </p>
      ) : (
        <div className="mt-5 space-y-2.5">
          {DAYS.map((d) => {
            const featured = byDay[d.value] ?? [];
            const featuredIds = new Set(featured.map((r) => r.product.id));
            const available = products.filter((p) => !featuredIds.has(p.id));
            return (
              <div
                key={d.value}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-slate-900">{d.label}</h3>
                  <select
                    value=""
                    disabled={busy || available.length === 0}
                    onChange={(e) => add(d.value, e.target.value)}
                    className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm outline-none focus:border-brand-500 disabled:opacity-50"
                  >
                    <option value="">+ Feature a dish…</option>
                    {available.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                {featured.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {featured.map((r) => (
                      <span
                        key={r.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700"
                      >
                        {r.product.name}
                        <button
                          onClick={() => remove(r.id)}
                          disabled={busy}
                          className="text-brand-400 hover:text-brand-700"
                          aria-label="Remove"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
