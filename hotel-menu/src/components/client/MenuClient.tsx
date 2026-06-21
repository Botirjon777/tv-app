"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Minus, Plus, ShoppingBag, UtensilsCrossed } from "lucide-react";
import type { MenuCategoryDTO, ProductDTO } from "@/types";
import { useCart } from "./useCart";
import { cn } from "@/lib/utils";
import { PriceTag } from "./PriceTag";
import {
  DEFAULT_LANG,
  LANGS,
  LANG_SHORT,
  isLang,
  resolveText,
  t,
  type Lang,
} from "@/lib/i18n";
import { CartSheet } from "./CartSheet";
import { OrderTracker } from "./OrderTracker";
import { RecommendationBanner } from "./RecommendationBanner";

type Room = { id: string; number: string; name: string };
type Hotel = { slug: string; name: string };

const LANG_KEY = "hotel-menu-lang";

export function MenuClient({
  hotel,
  room,
  menu,
  recommendations = [],
  lang: controlledLang,
  onChangeLang,
  onBack,
}: {
  hotel: Hotel;
  room: Room;
  menu: MenuCategoryDTO[];
  recommendations?: ProductDTO[];
  lang?: Lang;
  onChangeLang?: (l: Lang) => void;
  onBack?: () => void;
}) {
  const cart = useCart(`${hotel.slug}:${room.number}`);
  const [internalLang, setInternalLang] = useState<Lang>(DEFAULT_LANG);
  const lang = controlledLang ?? internalLang;
  const [activeCategory, setActiveCategory] = useState(menu[0]?.id ?? "");
  const [cartOpen, setCartOpen] = useState(false);
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Restore the guest's language choice (only when uncontrolled — otherwise the
  // parent owns the language).
  useEffect(() => {
    if (controlledLang !== undefined) return;
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && isLang(saved)) setInternalLang(saved);
  }, [controlledLang]);

  const changeLang = (l: Lang) => {
    if (onChangeLang) {
      onChangeLang(l);
      return;
    }
    setInternalLang(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
  };

  const scrollToCategory = (id: string) => {
    setActiveCategory(id);
    sectionRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const quantities = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of cart.items) map[item.productId] = item.quantity;
    return map;
  }, [cart.items]);

  if (menu.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-2.5 bg-zinc-950 px-2.5 text-center text-zinc-400 lg:gap-5 lg:px-5">
        <UtensilsCrossed className="h-10 w-10 text-zinc-700" />
        <h1 className="font-serif text-xl font-bold text-zinc-100">
          {t(lang, "menuSoon")}
        </h1>
        <p className="text-sm">{t(lang, "menuSoonSub")}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 pb-28 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-2.5 py-2.5 lg:px-5 lg:py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              {onBack ? (
                <button
                  onClick={onBack}
                  aria-label={t(lang, "close")}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              ) : (
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-900/40">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-serif text-[15px] font-semibold leading-tight text-zinc-50">
                  {hotel.name}
                </p>
                <p className="truncate text-xs text-zinc-400">
                  {t(lang, "inRoomDining")} · {t(lang, "room")} {room.number}
                </p>
              </div>
            </div>

            {/* Language switcher */}
            <div className="flex flex-shrink-0 items-center rounded-full border border-zinc-800 bg-zinc-900 p-0.5">
              {LANGS.map((l) => (
                <button
                  key={l}
                  onClick={() => changeLang(l)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-bold transition",
                    lang === l
                      ? "bg-brand-600 text-white"
                      : "text-zinc-400 hover:text-zinc-100"
                  )}
                >
                  {LANG_SHORT[l]}
                </button>
              ))}
            </div>
          </div>

          {/* Category tabs */}
          <nav className="no-scrollbar -mx-2.5 mt-3 flex gap-2 overflow-x-auto px-2.5 lg:-mx-5 lg:px-5">
            {menu.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={cn(
                  "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition",
                  activeCategory === cat.id
                    ? "bg-zinc-100 text-zinc-900"
                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                )}
              >
                {resolveText(cat.nameI18n, lang, cat.name)}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Today's recommendations */}
      <div className="mx-auto max-w-2xl px-2.5 lg:px-5">
        <RecommendationBanner
          items={recommendations}
          lang={lang}
          onAdd={(product) =>
            cart.add({
              ...product,
              name: resolveText(product.nameI18n, lang, product.name),
            })
          }
        />
      </div>

      {/* Menu sections */}
      <div className="mx-auto max-w-2xl px-2.5 lg:px-5">
        {menu.map((cat) => (
          <section
            key={cat.id}
            ref={(el) => {
              sectionRefs.current[cat.id] = el;
            }}
            className="scroll-mt-32 pt-7"
          >
            <h2 className="mb-3 font-serif text-xl font-bold tracking-tight text-zinc-50">
              {resolveText(cat.nameI18n, lang, cat.name)}
            </h2>
            <div className="space-y-2.5 lg:space-y-5">
              {cat.products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  lang={lang}
                  quantity={quantities[product.id] ?? 0}
                  onAdd={() =>
                    cart.add({
                      ...product,
                      name: resolveText(product.nameI18n, lang, product.name),
                    })
                  }
                  onInc={() =>
                    cart.setQuantity(
                      product.id,
                      (quantities[product.id] ?? 0) + 1
                    )
                  }
                  onDec={() =>
                    cart.setQuantity(
                      product.id,
                      (quantities[product.id] ?? 0) - 1
                    )
                  }
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Floating cart bar */}
      {cart.count > 0 && (
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 animate-slide-up px-2.5 pb-2.5 lg:px-5 lg:pb-5">
          <div className="mx-auto max-w-2xl">
            <button
              onClick={() => setCartOpen(true)}
              className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-4 text-white shadow-xl shadow-brand-900/40 transition active:scale-[0.99]"
            >
              <span className="flex items-center gap-2.5">
                <span className="relative">
                  <ShoppingBag className="h-5 w-5" />
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-brand-700">
                    {cart.count}
                  </span>
                </span>
                <span className="font-semibold">{t(lang, "viewCart")}</span>
              </span>
              <PriceTag
                uzs={cart.total}
                className="text-white"
                subClassName="text-white/70"
              />
            </button>
          </div>
        </div>
      )}

      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        lang={lang}
        hotelSlug={hotel.slug}
        roomNumber={room.number}
        onPlaced={(orderId) => {
          cart.clear();
          setCartOpen(false);
          setTrackedOrderId(orderId);
        }}
      />

      {trackedOrderId && (
        <OrderTracker
          orderId={trackedOrderId}
          lang={lang}
          onClose={() => setTrackedOrderId(null)}
        />
      )}
    </main>
  );
}

/* ------------------------------- Product row ------------------------------- */

function ProductRow({
  product,
  lang,
  quantity,
  onAdd,
  onInc,
  onDec,
}: {
  product: ProductDTO;
  lang: Lang;
  quantity: number;
  onAdd: () => void;
  onInc: () => void;
  onDec: () => void;
}) {
  const name = resolveText(product.nameI18n, lang, product.name);
  const desc = resolveText(product.descI18n, lang, product.description);

  return (
    <div className="flex gap-2.5 rounded-2xl border border-zinc-800 bg-zinc-900 p-2.5 shadow-lg shadow-black/20 lg:gap-5 lg:p-5">
      {product.imageUrl ? (
        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-800">
          <Image
            src={product.imageUrl}
            alt={name}
            fill
            sizes="96px"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-600">
          <UtensilsCrossed className="h-7 w-7" />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="font-semibold leading-tight text-zinc-50">{name}</h3>
        {desc && (
          <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400">{desc}</p>
        )}
        <div className="mt-auto flex items-end justify-between pt-2">
          <PriceTag
            uzs={product.price}
            align="left"
            className="text-zinc-100"
            subClassName="text-zinc-500"
          />

          {quantity === 0 ? (
            <button
              onClick={onAdd}
              className="rounded-full bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-500"
            >
              {t(lang, "add")}
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-full bg-zinc-800 px-1.5 py-1">
              <button
                onClick={onDec}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700 text-zinc-100"
                aria-label="−"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-4 text-center text-sm font-bold text-zinc-100">
                {quantity}
              </span>
              <button
                onClick={onInc}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white"
                aria-label="+"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
