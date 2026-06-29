"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Plus, Sparkles, UtensilsCrossed } from "lucide-react";
import { PriceTag } from "./PriceTag";
import { cn } from "@/lib/utils";
import { resolveText, t, type Lang } from "@/lib/i18n";
import type { ProductDTO } from "@/types";

// Auto-rotating, swipeable banner of "today's recommendations".
export function RecommendationBanner({
  items,
  lang,
  onAdd,
}: {
  items: ProductDTO[];
  lang: Lang;
  onAdd: (product: ProductDTO) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Auto-advance every 5s (only when there's more than one slide).
  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      const next = (active + 1) % items.length;
      const track = trackRef.current;
      if (track) {
        track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [active, items.length]);

  if (items.length === 0) return null;

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const idx = Math.round(track.scrollLeft / track.clientWidth);
    if (idx !== active) setActive(idx);
  };

  return (
    <section className="pt-2.5 lg:pt-5">
      <div className="mb-2 flex items-center gap-1.5 text-brand-400">
        <Sparkles className="h-4 w-4" />
        <h2 className="text-sm font-semibold uppercase tracking-wide">
          {t(lang, "recommendedToday")}
        </h2>
      </div>

      <div
        ref={trackRef}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-2xl"
      >
        {items.map((product) => {
          const name = resolveText(product.nameI18n, lang, product.name);
          const desc = resolveText(product.descI18n, lang, product.description);
          return (
            <div
              key={product.id}
              className="relative h-44 w-full flex-shrink-0 snap-center overflow-hidden"
            >
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={name}
                  fill
                  sizes="(max-width: 672px) 100vw, 672px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-600">
                  <UtensilsCrossed className="h-10 w-10" />
                </div>
              )}
              {/* readability gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-2.5 lg:p-5">
                <div className="min-w-0">
                  <h3 className="truncate font-serif text-xl font-bold text-white">
                    {name}
                  </h3>
                  {desc && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-white/70">
                      {desc}
                    </p>
                  )}
                  <PriceTag
                    uzs={product.price}
                    align="left"
                    className="mt-1 text-white"
                    subClassName="text-white/60"
                  />
                </div>
                <button
                  onClick={() => onAdd(product)}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-black/40 transition active:scale-95"
                  aria-label={t(lang, "add")}
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dots */}
      {items.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {items.map((it, i) => (
            <span
              key={it.id}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === active ? "w-5 bg-brand-500" : "w-1.5 bg-zinc-200 dark:bg-zinc-700"
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
