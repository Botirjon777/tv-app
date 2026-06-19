"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { CalendarDays, Plus, UtensilsCrossed, X } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button, CenteredSpinner } from "@/components/ui";
import { api } from "@/lib/client-api";
import { formatPrice, cn } from "@/lib/utils";
import type { ProductDTO, RecommendationDTO } from "@/types";

// Displayed Monday-first; dow values are 0=Sun … 6=Sat.
const DAYS: { dow: number; label: string }[] = [
  { dow: 1, label: "Monday" },
  { dow: 2, label: "Tuesday" },
  { dow: 3, label: "Wednesday" },
  { dow: 4, label: "Thursday" },
  { dow: 5, label: "Friday" },
  { dow: 6, label: "Saturday" },
  { dow: 0, label: "Sunday" },
];

export default function RecommendationsPage() {
  const qc = useQueryClient();
  const today = new Date().getDay();

  const recsQ = useQuery({
    queryKey: ["recommendations"],
    queryFn: () => api.get<RecommendationDTO[]>("/api/recommendations"),
  });
  const productsQ = useQuery({
    queryKey: ["products"],
    queryFn: () => api.get<ProductDTO[]>("/api/products"),
  });

  const addMut = useMutation({
    mutationFn: (vars: { dayOfWeek: number; productId: string }) =>
      api.post("/api/recommendations", vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recommendations"] }),
    onError: (e: Error) => alert(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => api.del(`/api/recommendations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recommendations"] }),
  });

  const byDay = useMemo(() => {
    const map: Record<number, RecommendationDTO[]> = {};
    for (const r of recsQ.data ?? []) (map[r.dayOfWeek] ??= []).push(r);
    return map;
  }, [recsQ.data]);

  const products = productsQ.data ?? [];

  return (
    <div>
      <PageHeader
        title="Menu recommendations"
        description="Feature a “recommendation of the day” for each weekday — guests see it in a banner at the top of the menu."
      />

      {recsQ.isLoading ? (
        <CenteredSpinner />
      ) : (
        <div className="grid gap-2.5 lg:grid-cols-2 lg:gap-5 xl:grid-cols-3">
          {DAYS.map((day) => (
            <DayCard
              key={day.dow}
              label={day.label}
              isToday={day.dow === today}
              recs={byDay[day.dow] ?? []}
              products={products}
              onAdd={(productId) =>
                addMut.mutate({ dayOfWeek: day.dow, productId })
              }
              onRemove={(id) => delMut.mutate(id)}
              adding={addMut.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DayCard({
  label,
  isToday,
  recs,
  products,
  onAdd,
  onRemove,
  adding,
}: {
  label: string;
  isToday: boolean;
  recs: RecommendationDTO[];
  products: ProductDTO[];
  onAdd: (productId: string) => void;
  onRemove: (id: string) => void;
  adding: boolean;
}) {
  const [pick, setPick] = useState("");
  const usedIds = new Set(recs.map((r) => r.product.id));
  const available = products.filter((p) => !usedIds.has(p.id));

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-2.5 shadow-sm lg:p-5">
      <div className="mb-3 flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-slate-400" />
        <h2 className="font-bold text-slate-900">{label}</h2>
        {isToday && (
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-700">
            Today
          </span>
        )}
        <span className="ml-auto text-xs text-slate-400">{recs.length}</span>
      </div>

      {recs.length === 0 ? (
        <p className="mb-3 rounded-lg bg-slate-50 px-3 py-3 text-center text-xs text-slate-400">
          No recommendation for {label}.
        </p>
      ) : (
        <ul className="mb-3 space-y-2">
          {recs.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-2.5 rounded-xl border border-slate-100 p-2"
            >
              <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {r.product.imageUrl ? (
                  <Image
                    src={r.product.imageUrl}
                    alt={r.product.name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-300">
                    <UtensilsCrossed className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">
                  {r.product.name}
                </p>
                <p className="text-xs text-slate-400">
                  {formatPrice(r.product.price)}
                </p>
              </div>
              <button
                onClick={() => onRemove(r.id)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                aria-label="Remove"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <select
          value={pick}
          onChange={(e) => setPick(e.target.value)}
          className="h-9 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-sm outline-none focus:border-brand-500"
        >
          <option value="">Add a product…</option>
          {available.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          disabled={!pick || adding}
          onClick={() => {
            if (pick) {
              onAdd(pick);
              setPick("");
            }
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
