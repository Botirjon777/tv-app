"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowLeft, ArrowUp, Minus, Plus, ShoppingBag, UtensilsCrossed } from "lucide-react";
import type { MenuCategoryDTO, ProductDTO } from "@/types";
import { useCart } from "./useCart";
import { cn } from "@/lib/utils";
import { PriceTag } from "./PriceTag";
import { resolveText, t, type Lang } from "@/lib/i18n";
import { computeServiceFee } from "@/lib/fees";
import { CartSheet } from "./CartSheet";
import { OrderTracker } from "./OrderTracker";
import { RecommendationBanner } from "./RecommendationBanner";
import { RoomControls } from "./RoomControls";
import { useLang } from "./useLang";
import { useTheme } from "./useTheme";

type Room = { id: string; number: string; name: string };
type Hotel = {
  slug: string;
  name: string;
  serviceFeeType: string;
  serviceFeeValue: number;
  preorderEnabled: boolean;
};

export function MenuClient({
  hotel,
  room,
  menu,
  recommendations = [],
}: {
  hotel: Hotel;
  room: Room;
  menu: MenuCategoryDTO[];
  recommendations?: ProductDTO[];
}) {
  const router = useRouter();
  const { lang, changeLang } = useLang();
  const { theme, toggleTheme } = useTheme();
  const backHref = `/${hotel.slug}/${room.number}`;
  const cart = useCart(`${hotel.slug}:${room.number}`);
  const [activeCategory, setActiveCategory] = useState(menu[0]?.id ?? "");
  const [cartOpen, setCartOpen] = useState(false);
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);
  const [showTop, setShowTop] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // The menu is its own route — start at the top each time it opens.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Show the scroll-to-top button once the guest has scrolled down a bit.
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const serviceFee = computeServiceFee(
    cart.total,
    hotel.serviceFeeType,
    hotel.serviceFeeValue
  );
  const grandTotal = cart.total + serviceFee;

  if (menu.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-2.5 bg-zinc-50 px-2.5 text-center text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400 lg:gap-5 lg:px-5">
        <UtensilsCrossed className="h-10 w-10 text-zinc-300 dark:text-zinc-700" />
        <h1 className="font-serif text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {t(lang, "menuSoon")}
        </h1>
        <p className="text-sm">{t(lang, "menuSoonSub")}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 pb-28 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-zinc-50/85 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/85">
        <div className="mx-auto max-w-2xl px-2.5 py-2.5 lg:px-5 lg:py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                onClick={() => router.push(backHref)}
                aria-label={t(lang, "close")}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate font-serif text-[15px] font-semibold leading-tight text-zinc-900 dark:text-zinc-50">
                  {hotel.name}
                </p>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {t(lang, "inRoomDining")} · {t(lang, "room")} {room.number}
                </p>
              </div>
            </div>

            <RoomControls
              lang={lang}
              onChangeLang={changeLang}
              theme={theme}
              onToggleTheme={toggleTheme}
              align="end"
            />
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
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-white text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
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
      <motion.div
        className="mx-auto max-w-2xl px-2.5 lg:px-5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {menu.map((cat) => (
          <section
            key={cat.id}
            ref={(el) => {
              sectionRefs.current[cat.id] = el;
            }}
            className="scroll-mt-32 pt-7"
          >
            <h2 className="mb-3 font-serif text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
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
      </motion.div>

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
                uzs={grandTotal}
                className="text-white"
                subClassName="text-white/70"
              />
            </button>
          </div>
        </div>
      )}

      {/* Scroll to top */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label={t(lang, "backToTop")}
          className={cn(
            "fixed right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-lg transition active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 lg:right-6",
            cart.count > 0 ? "bottom-24" : "bottom-6"
          )}
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        lang={lang}
        hotelSlug={hotel.slug}
        roomNumber={room.number}
        feeType={hotel.serviceFeeType}
        feeValue={hotel.serviceFeeValue}
        preorderEnabled={hotel.preorderEnabled}
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
    <div className="flex gap-2.5 rounded-2xl border border-zinc-200 bg-white p-2.5 shadow-lg shadow-black/5 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/20 lg:gap-5 lg:p-5">
      {product.imageUrl ? (
        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
          <Image
            src={product.imageUrl}
            alt={name}
            fill
            sizes="96px"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600">
          <UtensilsCrossed className="h-7 w-7" />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="font-semibold leading-tight text-zinc-900 dark:text-zinc-50">{name}</h3>
        {desc && (
          <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">{desc}</p>
        )}
        <div className="mt-auto flex items-end justify-between pt-2">
          <PriceTag
            uzs={product.price}
            align="left"
            className="text-zinc-900 dark:text-zinc-100"
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
            <div className="flex items-center gap-3 rounded-full bg-zinc-100 px-1.5 py-1 dark:bg-zinc-800">
              <button
                onClick={onDec}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
                aria-label="−"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-4 text-center text-sm font-bold text-zinc-900 dark:text-zinc-100">
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
