"use client";

import { useEffect, useState } from "react";
import { approxUsd, formatPrice, cn } from "@/lib/utils";

// Shared live USD/UZS rate for all PriceTags on the page (fetched once).
const globalForFx = globalThis as unknown as { __uzsPerUsd?: number };

export function useFxRate(): number | null {
  const [rate, setRate] = useState<number | null>(
    globalForFx.__uzsPerUsd ?? null
  );
  useEffect(() => {
    if (globalForFx.__uzsPerUsd) {
      setRate(globalForFx.__uzsPerUsd);
      return;
    }
    let active = true;
    fetch("/api/fx", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d?.uzsPerUsd) {
          globalForFx.__uzsPerUsd = d.uzsPerUsd;
          setRate(d.uzsPerUsd);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return rate;
}

// UZS price with an approximate USD line beneath it.
export function PriceTag({
  uzs,
  className,
  subClassName,
  align = "right",
}: {
  uzs: number;
  className?: string;
  subClassName?: string;
  align?: "right" | "left";
}) {
  const rate = useFxRate();
  return (
    <div className={cn(align === "right" ? "text-right" : "text-left")}>
      <div className={cn("font-bold leading-tight", className)}>
        {formatPrice(uzs)}
      </div>
      {rate && (
        <div className={cn("text-[11px] leading-tight opacity-60", subClassName)}>
          ≈ {approxUsd(uzs, rate)}
        </div>
      )}
    </div>
  );
}
