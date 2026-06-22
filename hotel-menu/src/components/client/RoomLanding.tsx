"use client";

import { useState } from "react";
import {
  AlarmClock,
  AlertTriangle,
  BellRing,
  Car,
  Check,
  Copy,
  ExternalLink,
  Hotel,
  Instagram,
  MapPin,
  Send,
  Star,
  UtensilsCrossed,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LANGS, LANG_SHORT, t, type Lang } from "@/lib/i18n";
import { Modal, Button, Textarea } from "@/components/ui";

type RequestType = "ALARM" | "SERVICE" | "TAXI" | "RECEPTION" | "PROBLEM";

// Hotel data surfaced on the in-room landing. Shared with RoomExperience.
export type LandingHotel = {
  slug: string;
  name: string;
  imageUrl?: string;
  logoUrl?: string;
  tripadvisorUrl?: string;
  googleMapsUrl?: string;
  yandexMapsUrl?: string;
  wifiName?: string;
  wifiPassword?: string;
  instagramUrl?: string;
  telegramUrl?: string;
};

export function RoomLanding({
  hotel,
  room,
  lang,
  onChangeLang,
  onOpenMenu,
}: {
  hotel: LandingHotel;
  room: { number: string };
  lang: Lang;
  onChangeLang: (l: Lang) => void;
  onOpenMenu: () => void;
}) {
  const [active, setActive] = useState<RequestType | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [wifiOpen, setWifiOpen] = useState(false);

  const services: {
    type: RequestType;
    title: () => string;
    sub: () => string;
    icon: LucideIcon;
    accent: string;
  }[] = [
    {
      type: "ALARM",
      title: () => t(lang, "svcAlarm"),
      sub: () => t(lang, "svcAlarmSub"),
      icon: AlarmClock,
      accent: "from-orange-500 to-rose-600",
    },
    {
      type: "SERVICE",
      title: () => t(lang, "svcService"),
      sub: () => t(lang, "svcServiceSub"),
      icon: Hotel,
      accent: "from-sky-500 to-indigo-600",
    },
    {
      type: "TAXI",
      title: () => t(lang, "svcTaxi"),
      sub: () => t(lang, "svcTaxiSub"),
      icon: Car,
      accent: "from-yellow-500 to-amber-600",
    },
    {
      type: "RECEPTION",
      title: () => t(lang, "svcReception"),
      sub: () => t(lang, "svcReceptionSub"),
      icon: BellRing,
      accent: "from-amber-500 to-orange-600",
    },
    {
      type: "PROBLEM",
      title: () => t(lang, "svcProblem"),
      sub: () => t(lang, "svcProblemSub"),
      icon: AlertTriangle,
      accent: "from-rose-500 to-red-700",
    },
  ];

  const openRequest = (type: RequestType) => {
    setActive(type);
    setNote("");
    setSent(false);
    setError(null);
  };

  const closeModal = () => {
    if (sending) return;
    setActive(null);
  };

  const submit = async () => {
    if (!active) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelSlug: hotel.slug,
          roomNumber: room.number,
          type: active,
          note,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || t(lang, "requestFailed"));
      }
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t(lang, "requestFailed"));
    } finally {
      setSending(false);
    }
  };

  const activeSvc = services.find((s) => s.type === active);

  return (
    <main className="min-h-screen bg-zinc-950 pb-10 text-zinc-100">
      <div className="mx-auto max-w-2xl px-3 lg:px-5">
        {/* Top bar: language switcher + room number */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center rounded-full border border-zinc-800 bg-zinc-900/80 p-0.5">
            {LANGS.map((l) => (
              <button
                key={l}
                onClick={() => onChangeLang(l)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-bold transition",
                  lang === l
                    ? "bg-brand-600 text-white"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                {LANG_SHORT[l]}
              </button>
            ))}
          </div>
          <div className="rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-sm">
            <span className="text-zinc-400">{t(lang, "room")} </span>
            <span className="font-bold text-zinc-50">{room.number}</span>
          </div>
        </div>

        {/* Brand header: logo + hotel name */}
        <div className="mt-6 flex items-center gap-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
            {hotel.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={hotel.logoUrl}
                alt={hotel.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <Hotel className="h-8 w-8 text-brand-400" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-serif text-2xl font-bold leading-tight text-white">
              {hotel.name}
            </h1>
            <p className="mt-0.5 text-sm text-zinc-400">
              {t(lang, "welcome")} · {t(lang, "howCanWeHelp")}
            </p>
          </div>
        </div>

        {/* Tile grid */}
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3">
          {services.map((svc) => (
            <Tile
              key={svc.type}
              icon={svc.icon}
              accent={svc.accent}
              label={svc.title()}
              sub={svc.sub()}
              onClick={() => openRequest(svc.type)}
            />
          ))}

          <Tile
            icon={UtensilsCrossed}
            accent="from-brand-500 to-brand-700"
            label={t(lang, "openMenu")}
            sub={t(lang, "menuSubtitle")}
            onClick={onOpenMenu}
          />

          <Tile
            icon={Star}
            accent="from-yellow-400 to-amber-600"
            label={t(lang, "writeReview")}
            sub={t(lang, "writeReviewSub")}
            onClick={() => setReviewOpen(true)}
          />

          <Tile
            className="col-span-2"
            icon={Wifi}
            accent="from-emerald-500 to-teal-600"
            label={t(lang, "wifi")}
            sub={t(lang, "wifiSub")}
            onClick={() => setWifiOpen(true)}
          />
        </div>

        {/* Social footer */}
        {(hotel.instagramUrl || hotel.telegramUrl) && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <p className="text-sm text-zinc-400">{t(lang, "followUs")}</p>
            <div className="flex items-center gap-3">
              {hotel.instagramUrl && (
                <a
                  href={hotel.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-600 via-rose-500 to-amber-500 text-white shadow-lg transition active:scale-95"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {hotel.telegramUrl && (
                <a
                  href={hotel.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Telegram"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg transition active:scale-95"
                >
                  <Send className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Service request modal */}
      <Modal
        open={active !== null}
        onClose={closeModal}
        dark
        title={activeSvc ? activeSvc.title() : ""}
        footer={
          sent ? (
            <Button className="w-full" onClick={closeModal}>
              {t(lang, "close")}
            </Button>
          ) : (
            <div className="flex gap-2.5">
              <Button
                variant="outline"
                className="flex-1 border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
                onClick={closeModal}
                disabled={sending}
              >
                {t(lang, "cancel")}
              </Button>
              <Button className="flex-1" onClick={submit} loading={sending}>
                {t(lang, "send")}
              </Button>
            </div>
          )
        }
      >
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15 text-green-400">
              <Check className="h-8 w-8" />
            </div>
            <p className="text-lg font-bold text-zinc-50">
              {t(lang, "requestSent")}
            </p>
            <p className="max-w-xs text-sm text-zinc-400">
              {t(lang, "requestSentSub")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-zinc-400">
              {activeSvc?.sub()} · {t(lang, "room")} {room.number}
            </p>
            <Textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t(lang, "requestNotePlaceholder")}
              className="border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-brand-500 focus:ring-brand-900"
            />
            {error && <p className="text-sm text-rose-400">{error}</p>}
          </div>
        )}
      </Modal>

      {/* Write a review modal */}
      <ReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        lang={lang}
        hotel={hotel}
      />

      {/* Wi-Fi modal */}
      <WifiModal
        open={wifiOpen}
        onClose={() => setWifiOpen(false)}
        lang={lang}
        hotel={hotel}
      />
    </main>
  );
}

/* --------------------------------- Tile ---------------------------------- */

function Tile({
  icon: Icon,
  accent,
  label,
  sub,
  onClick,
  className,
}: {
  icon: LucideIcon;
  accent: string;
  label: string;
  sub?: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex min-w-0 flex-col items-center gap-2.5 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-center shadow-lg shadow-black/20 transition hover:border-zinc-700 hover:bg-zinc-800 active:scale-[0.98]",
        className
      )}
    >
      <div
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md",
          accent
        )}
      >
        <Icon className="h-7 w-7" />
      </div>
      <div className="min-w-0">
        <p className="font-semibold leading-tight text-zinc-50">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-zinc-400">{sub}</p>}
      </div>
    </button>
  );
}

/* ------------------------------ Review modal ----------------------------- */

function ReviewModal({
  open,
  onClose,
  lang,
  hotel,
}: {
  open: boolean;
  onClose: () => void;
  lang: Lang;
  hotel: LandingHotel;
}) {
  const links: { label: string; url?: string; accent: string }[] = [
    {
      label: "TripAdvisor",
      url: hotel.tripadvisorUrl,
      accent: "from-emerald-500 to-green-600",
    },
    {
      label: "Google Maps",
      url: hotel.googleMapsUrl,
      accent: "from-blue-500 to-indigo-600",
    },
    {
      label: "Yandex Maps",
      url: hotel.yandexMapsUrl,
      accent: "from-amber-500 to-red-600",
    },
  ].filter((l) => Boolean(l.url));

  return (
    <Modal open={open} onClose={onClose} dark title={t(lang, "writeReview")}>
      <p className="mb-4 text-sm text-zinc-400">{t(lang, "reviewModalSub")}</p>
      {links.length === 0 ? (
        <p className="rounded-xl bg-zinc-800 px-4 py-6 text-center text-sm text-zinc-400">
          {t(lang, "askReception")}
        </p>
      ) : (
        <div className="space-y-2.5">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-3.5 transition hover:border-zinc-700 hover:bg-zinc-800 active:scale-[0.99]"
            >
              <div
                className={cn(
                  "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
                  l.accent
                )}
              >
                <MapPin className="h-5 w-5" />
              </div>
              <span className="flex-1 font-semibold text-zinc-50">
                {l.label}
              </span>
              <ExternalLink className="h-5 w-5 flex-shrink-0 text-zinc-500" />
            </a>
          ))}
        </div>
      )}
    </Modal>
  );
}

/* ------------------------------- Wi-Fi modal ----------------------------- */

function WifiModal({
  open,
  onClose,
  lang,
  hotel,
}: {
  open: boolean;
  onClose: () => void;
  lang: Lang;
  hotel: LandingHotel;
}) {
  const [copied, setCopied] = useState<"name" | "password" | null>(null);

  const copy = async (value: string, field: "name" | "password") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  const rows: { label: string; value?: string; field: "name" | "password" }[] =
    [
      { label: t(lang, "wifiNetwork"), value: hotel.wifiName, field: "name" },
      {
        label: t(lang, "wifiPasswordLabel"),
        value: hotel.wifiPassword,
        field: "password",
      },
    ];

  const hasWifi = Boolean(hotel.wifiName || hotel.wifiPassword);

  return (
    <Modal open={open} onClose={onClose} dark title={t(lang, "wifi")}>
      {!hasWifi ? (
        <p className="rounded-xl bg-zinc-800 px-4 py-6 text-center text-sm text-zinc-400">
          {t(lang, "askReception")}
        </p>
      ) : (
        <div className="space-y-2.5">
          {rows
            .filter((r) => Boolean(r.value))
            .map((r) => (
              <div
                key={r.field}
                className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-3.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-500">{r.label}</p>
                  <p className="truncate font-mono text-base font-semibold text-zinc-50">
                    {r.value}
                  </p>
                </div>
                <button
                  onClick={() => copy(r.value!, r.field)}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800"
                >
                  {copied === r.field ? (
                    <>
                      <Check className="h-4 w-4 text-green-400" />
                      {t(lang, "copied")}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      {t(lang, "copy")}
                    </>
                  )}
                </button>
              </div>
            ))}
        </div>
      )}
    </Modal>
  );
}
