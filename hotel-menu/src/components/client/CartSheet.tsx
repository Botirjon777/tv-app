"use client";

import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { PriceTag } from "./PriceTag";
import { t, type Lang } from "@/lib/i18n";
import { computeServiceFee } from "@/lib/fees";
import type { useCart } from "./useCart";

type Cart = ReturnType<typeof useCart>;

export function CartSheet({
  open,
  onClose,
  cart,
  lang,
  hotelSlug,
  roomNumber,
  feeType,
  feeValue,
  onPlaced,
}: {
  open: boolean;
  onClose: () => void;
  cart: Cart;
  lang: Lang;
  hotelSlug: string;
  roomNumber: string;
  feeType: string;
  feeValue: number;
  onPlaced: (orderId: string) => void;
}) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serviceFee = computeServiceFee(cart.total, feeType, feeValue);
  const grandTotal = cart.total + serviceFee;

  const placeOrder = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelSlug,
          roomNumber,
          note,
          items: cart.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || t(lang, "couldNotPlace"));
      }
      setNote("");
      onPlaced(data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : t(lang, "couldNotPlace"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t(lang, "yourOrder")}
      footer={
        <div className="space-y-2.5 lg:space-y-5">
          {error && (
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}
          {serviceFee > 0 && (
            <div className="space-y-1 text-sm text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center justify-between">
                <span>{t(lang, "subtotal")}</span>
                <PriceTag
                  uzs={cart.total}
                  className="text-sm font-normal text-zinc-600 dark:text-zinc-300"
                  subClassName="text-zinc-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span>
                  {t(lang, "serviceFee")}
                  {feeType === "percent" ? ` (${feeValue}%)` : ""}
                </span>
                <PriceTag
                  uzs={serviceFee}
                  className="text-sm font-normal text-zinc-600 dark:text-zinc-300"
                  subClassName="text-zinc-500"
                />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between text-base font-bold">
            <span>{t(lang, "total")}</span>
            <PriceTag uzs={grandTotal} subClassName="text-zinc-500" />
          </div>
          <Button
            size="lg"
            className="w-full"
            loading={submitting}
            disabled={cart.items.length === 0}
            onClick={placeOrder}
          >
            {t(lang, "placeOrder")} · {t(lang, "room")} {roomNumber}
          </Button>
          <p className="text-center text-xs text-zinc-500">
            {t(lang, "placeOrderHint")}
          </p>
        </div>
      }
    >
      {cart.items.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          {t(lang, "emptyCart")}
        </p>
      ) : (
        <div className="space-y-2.5 lg:space-y-5">
          <ul className="divide-y divide-zinc-800">
            {cart.items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                    {item.name}
                  </p>
                  <PriceTag
                    uzs={item.price}
                    align="left"
                    className="text-sm font-normal text-zinc-500 dark:text-zinc-400"
                    subClassName="text-zinc-600"
                  />
                </div>
                <div className="flex items-center gap-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 px-1.5 py-1">
                  <button
                    onClick={() =>
                      cart.setQuantity(item.productId, item.quantity - 1)
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                    aria-label="−"
                  >
                    {item.quantity === 1 ? (
                      <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    ) : (
                      <Minus className="h-4 w-4" />
                    )}
                  </button>
                  <span className="w-4 text-center text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      cart.setQuantity(item.productId, item.quantity + 1)
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white"
                    aria-label="+"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <textarea
            rows={2}
            placeholder={t(lang, "notePlaceholder")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-brand-500"
          />
        </div>
      )}
    </Modal>
  );
}
