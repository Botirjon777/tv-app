"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, ChefHat, Clock, PartyPopper, X } from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import { PriceTag } from "./PriceTag";
import { cn } from "@/lib/utils";
import { t, type Lang } from "@/lib/i18n";
import type { OrderStatus } from "@/lib/orders";
import type { OrderDTO } from "@/types";

const STEPS: {
  status: OrderStatus;
  key: "stepReceived" | "stepPreparing" | "stepReady" | "stepDelivered";
  icon: React.ReactNode;
}[] = [
  { status: "PENDING", key: "stepReceived", icon: <Clock className="h-4 w-4" /> },
  { status: "PREPARING", key: "stepPreparing", icon: <ChefHat className="h-4 w-4" /> },
  { status: "READY", key: "stepReady", icon: <PartyPopper className="h-4 w-4" /> },
  { status: "DELIVERED", key: "stepDelivered", icon: <Check className="h-4 w-4" /> },
];

export function OrderTracker({
  orderId,
  lang,
  onClose,
}: {
  orderId: string;
  lang: Lang;
  onClose: () => void;
}) {
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
        if (res.ok && active) setOrder(await res.json());
      } catch {
        /* keep last known state */
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    const timer = setInterval(load, 4000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [orderId]);

  const currentIndex = order
    ? STEPS.findIndex((s) => s.status === order.status)
    : -1;
  const cancelled = order?.status === "CANCELLED";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 animate-fade-in">
      <header className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-2.5 py-2.5 lg:px-5 lg:py-5">
        <h2 className="font-serif text-lg font-bold">{t(lang, "orderStatus")}</h2>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-2.5 py-2.5 lg:px-5 lg:py-5">
        {loading && !order ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : !order ? (
          <p className="py-20 text-center text-sm text-zinc-500">
            {t(lang, "couldNotLoad")}
          </p>
        ) : (
          <>
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="relative mb-3 flex h-16 w-16 items-center justify-center">
                <motion.span
                  className="absolute inset-0 rounded-full bg-emerald-500/30"
                  initial={{ scale: 0.6, opacity: 0.7 }}
                  animate={{ scale: 1.9, opacity: 0 }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                />
                <motion.div
                  className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                  initial={{ scale: 0, rotate: -25 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: 0.18,
                      type: "spring",
                      stiffness: 300,
                      damping: 14,
                    }}
                  >
                    <Check className="h-8 w-8" strokeWidth={3} />
                  </motion.span>
                </motion.div>
              </div>
              <motion.p
                className="text-base font-bold text-zinc-900 dark:text-zinc-50"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.35, ease: "easeOut" }}
              >
                {t(lang, "thanks")}
              </motion.p>
              <motion.p
                className="mt-1 text-xs text-zinc-500 dark:text-zinc-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.38, duration: 0.4 }}
              >
                {t(lang, "orderNo")} #{order.id.slice(-6).toUpperCase()} ·{" "}
                {t(lang, "room")} {order.roomNumber}
              </motion.p>
            </div>

            {cancelled ? (
              <div className="rounded-2xl border border-rose-900/50 bg-rose-950/30 p-2.5 text-center text-rose-300 lg:p-5">
                <p className="font-semibold">{t(lang, "cancelledTitle")}</p>
                <p className="mt-1 text-sm">{t(lang, "cancelledSub")}</p>
              </div>
            ) : (
              <motion.ol
                className="relative space-y-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
              >
                {STEPS.map((step, idx) => {
                  const done = idx < currentIndex;
                  const active = idx === currentIndex;
                  return (
                    <li key={step.status} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full transition",
                            done && "bg-emerald-500 text-white",
                            active && "bg-brand-600 text-white animate-pulse-ring",
                            !done && !active && "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                          )}
                        >
                          {done ? <Check className="h-4 w-4" /> : step.icon}
                        </div>
                        {idx < STEPS.length - 1 && (
                          <div
                            className={cn(
                              "my-1 h-8 w-0.5",
                              idx < currentIndex
                                ? "bg-emerald-500"
                                : "bg-zinc-100 dark:bg-zinc-800"
                            )}
                          />
                        )}
                      </div>
                      <div className="pt-1.5">
                        <p
                          className={cn(
                            "font-semibold",
                            active ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-500"
                          )}
                        >
                          {t(lang, step.key)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </motion.ol>
            )}

            <motion.div
              className="mt-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 lg:p-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4, ease: "easeOut" }}
            >
              <h3 className="mb-2 text-sm font-bold text-zinc-700 dark:text-zinc-200">
                {t(lang, "orderSummary")}
              </h3>
              <ul className="space-y-1.5 text-sm">
                {order.items.map((it) => (
                  <li
                    key={it.id}
                    className="flex justify-between gap-3 text-zinc-500 dark:text-zinc-400"
                  >
                    <span>
                      {it.quantity}× {it.name}
                    </span>
                    <PriceTag
                      uzs={it.price * it.quantity}
                      className="text-sm font-normal text-zinc-600 dark:text-zinc-300"
                      subClassName="text-zinc-600"
                    />
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-3 font-bold">
                <span>{t(lang, "total")}</span>
                <PriceTag uzs={order.total} subClassName="text-zinc-500" />
              </div>
              {order.note && (
                <p className="mt-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {t(lang, "note")}: {order.note}
                </p>
              )}
            </motion.div>
          </>
        )}
      </div>

      <div className="safe-bottom border-t border-zinc-200 dark:border-zinc-800 px-2.5 py-2.5 lg:px-5 lg:py-5">
        <Button variant="outline" className="w-full border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800" onClick={onClose}>
          {t(lang, "backToMenu")}
        </Button>
      </div>
    </div>
  );
}
