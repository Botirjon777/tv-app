"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Building2,
  Download,
  DoorOpen,
  Pencil,
  Plus,
  QrCode,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  Button,
  CenteredSpinner,
  EmptyState,
  Input,
  Label,
  Modal,
} from "@/components/ui";
import { api } from "@/lib/client-api";
import { downloadRoomQrPdf } from "@/lib/qrpdf";
import { slugify } from "@/lib/slug";
import type { HotelDTO, RoomDTO } from "@/types";

function baseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_BASE_URL ?? "";
}

export default function HotelsPage() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<HotelDTO | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const hotelsQ = useQuery({
    queryKey: ["hotels"],
    queryFn: () => api.get<HotelDTO[]>("/api/hotels"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.del(`/api/hotels/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hotels"] }),
    onError: (e: Error) => alert(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: (h: HotelDTO) =>
      api.patch(`/api/hotels/${h.id}`, { active: !h.active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hotels"] }),
  });

  const downloadQr = async (hotel: HotelDTO) => {
    setDownloadingId(hotel.id);
    try {
      const rooms = await api.get<RoomDTO[]>(
        `/api/rooms?hotelId=${hotel.id}`
      );
      if (rooms.length === 0) {
        alert("This hotel has no rooms yet.");
        return;
      }
      await downloadRoomQrPdf({
        hotelName: hotel.name,
        rooms,
        urlFor: (number) =>
          `${baseUrl()}/hotel/${hotel.slug}/room/${number}`,
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to build PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  const hotels = hotelsQ.data ?? [];

  return (
    <div>
      <PageHeader
        title="Hotels & QR codes"
        description="Create a hotel, auto-generate its rooms, and download all room QR codes as a PDF."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Add hotel
          </Button>
        }
      />

      {hotelsQ.isLoading ? (
        <CenteredSpinner />
      ) : hotels.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-10 w-10" />}
          title="No hotels yet"
          description="Add your first hotel — rooms and QR codes are generated automatically."
        />
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:gap-5 xl:grid-cols-3">
          {hotels.map((h) => (
            <div
              key={h.id}
              className="rounded-2xl border border-slate-100 bg-white p-2.5 shadow-sm lg:p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900">{h.name}</h2>
                    <p className="text-xs text-slate-400">/hotel/{h.slug}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleMut.mutate(h)}
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    h.active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {h.active ? "Active" : "Off"}
                </button>
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <DoorOpen className="h-4 w-4" /> {h.roomCount ?? 0} rooms
                </span>
                <span>
                  {h.floors} floors × {h.roomsPerFloor}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => downloadQr(h)}
                  loading={downloadingId === h.id}
                >
                  <Download className="h-4 w-4" /> QR PDF
                </Button>
                <Link href={`/admin/hotels/${h.id}`}>
                  <Button size="sm" variant="outline">
                    <QrCode className="h-4 w-4" /> Rooms
                  </Button>
                </Link>
                <button
                  onClick={() => setEditing(h)}
                  className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `Delete "${h.name}" and its ${h.roomCount ?? 0} rooms?`
                      )
                    )
                      deleteMut.mutate(h.id);
                  }}
                  className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <HotelForm
          hotel={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["hotels"] });
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------- Hotel form ------------------------------- */

function HotelForm({
  hotel,
  onClose,
  onSaved,
}: {
  hotel: HotelDTO | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(hotel);
  const [name, setName] = useState(hotel?.name ?? "");
  const [slug, setSlug] = useState(hotel?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [floors, setFloors] = useState(String(hotel?.floors ?? 3));
  const [roomsPerFloor, setRoomsPerFloor] = useState(
    String(hotel?.roomsPerFloor ?? 10)
  );
  // Guest-landing branding fields.
  const [logoUrl, setLogoUrl] = useState(hotel?.logoUrl ?? "");
  const [tripadvisorUrl, setTripadvisorUrl] = useState(
    hotel?.tripadvisorUrl ?? ""
  );
  const [googleMapsUrl, setGoogleMapsUrl] = useState(hotel?.googleMapsUrl ?? "");
  const [yandexMapsUrl, setYandexMapsUrl] = useState(hotel?.yandexMapsUrl ?? "");
  const [wifiName, setWifiName] = useState(hotel?.wifiName ?? "");
  const [wifiPassword, setWifiPassword] = useState(hotel?.wifiPassword ?? "");
  const [instagramUrl, setInstagramUrl] = useState(hotel?.instagramUrl ?? "");
  const [telegramUrl, setTelegramUrl] = useState(hotel?.telegramUrl ?? "");
  const [error, setError] = useState<string | null>(null);

  // Auto-fill the slug from the name until the user edits it manually.
  const onNameChange = (v: string) => {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const totalRooms =
    (parseInt(floors) || 0) * (parseInt(roomsPerFloor) || 0);

  const branding = {
    logoUrl,
    tripadvisorUrl,
    googleMapsUrl,
    yandexMapsUrl,
    wifiName,
    wifiPassword,
    instagramUrl,
    telegramUrl,
  };

  const save = useMutation({
    mutationFn: () => {
      if (isEdit) {
        return api.patch(`/api/hotels/${hotel!.id}`, { name, slug, ...branding });
      }
      return api.post("/api/hotels", {
        name,
        slug: slug || undefined,
        floors: parseInt(floors),
        roomsPerFloor: parseInt(roomsPerFloor),
        ...branding,
      });
    },
    onSuccess: onSaved,
    onError: (e: Error) => setError(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Hotel name is required");
    if (!isEdit && totalRooms < 1)
      return setError("Floors and rooms per floor must be at least 1");
    save.mutate();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Edit hotel" : "New hotel"}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" loading={save.isPending} onClick={submit}>
            {isEdit ? "Save" : `Create + ${totalRooms} rooms`}
          </Button>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-2.5 lg:space-y-5">
        <div>
          <Label>Hotel name</Label>
          <Input
            autoFocus
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Grand Plaza Hotel"
          />
        </div>
        <div>
          <Label>URL slug</Label>
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-slate-400">/hotel/</span>
            <Input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder="grand-plaza"
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Guests scan QR codes that point to /hotel/{slug || "…"}/room/101
          </p>
        </div>

        {!isEdit && (
          <div className="grid grid-cols-2 gap-2.5 lg:gap-5">
            <div>
              <Label>Floors</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={floors}
                onChange={(e) => setFloors(e.target.value)}
              />
            </div>
            <div>
              <Label>Rooms per floor</Label>
              <Input
                type="number"
                min={1}
                max={99}
                value={roomsPerFloor}
                onChange={(e) => setRoomsPerFloor(e.target.value)}
              />
            </div>
            <p className="col-span-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Will generate <strong>{totalRooms}</strong> rooms — numbered 101,
              102 … per floor.
            </p>
          </div>
        )}

        <div className="space-y-2.5 border-t border-slate-100 pt-4 lg:space-y-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Guest landing page
          </p>
          <div>
            <Label>Logo URL</Label>
            <Input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://…/logo.png"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5 lg:gap-5">
            <div>
              <Label>Wi-Fi network</Label>
              <Input
                value={wifiName}
                onChange={(e) => setWifiName(e.target.value)}
                placeholder="Hotel_Guest"
              />
            </div>
            <div>
              <Label>Wi-Fi password</Label>
              <Input
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                placeholder="welcome123"
              />
            </div>
          </div>
          <div>
            <Label>TripAdvisor URL</Label>
            <Input
              value={tripadvisorUrl}
              onChange={(e) => setTripadvisorUrl(e.target.value)}
              placeholder="https://www.tripadvisor.com/…"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5 lg:gap-5">
            <div>
              <Label>Google Maps URL</Label>
              <Input
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                placeholder="https://maps.google.com/…"
              />
            </div>
            <div>
              <Label>Yandex Maps URL</Label>
              <Input
                value={yandexMapsUrl}
                onChange={(e) => setYandexMapsUrl(e.target.value)}
                placeholder="https://yandex.com/maps/…"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 lg:gap-5">
            <div>
              <Label>Instagram URL</Label>
              <Input
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/…"
              />
            </div>
            <div>
              <Label>Telegram URL</Label>
              <Input
                value={telegramUrl}
                onChange={(e) => setTelegramUrl(e.target.value)}
                placeholder="https://t.me/…"
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
