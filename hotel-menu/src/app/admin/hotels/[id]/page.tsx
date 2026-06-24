"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { QRCodeCanvas } from "qrcode.react";
import {
  ArrowLeft,
  Download,
  DoorOpen,
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
import type { HotelDTO, RoomDTO } from "@/types";

function baseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_BASE_URL ?? "";
}

export default function HotelDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const qc = useQueryClient();
  const hotelId = params.id;
  const [qrRoom, setQrRoom] = useState<RoomDTO | null>(null);
  const [adding, setAdding] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const hotelsQ = useQuery({
    queryKey: ["hotels"],
    queryFn: () => api.get<HotelDTO[]>("/api/hotels"),
  });
  const roomsQ = useQuery({
    queryKey: ["rooms", hotelId],
    queryFn: () => api.get<RoomDTO[]>(`/api/rooms?hotelId=${hotelId}`),
  });

  const hotel = (hotelsQ.data ?? []).find((h) => h.id === hotelId);
  const rooms = roomsQ.data ?? [];

  const deleteRoom = useMutation({
    mutationFn: (id: string) => api.del(`/api/rooms/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms", hotelId] });
      qc.invalidateQueries({ queryKey: ["hotels"] });
    },
    onError: (e: Error) => alert(e.message),
  });

  const toggleRoom = useMutation({
    mutationFn: (r: RoomDTO) =>
      api.patch(`/api/rooms/${r.id}`, { active: !r.active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rooms", hotelId] }),
  });

  const urlFor = (number: string) =>
    `${baseUrl()}/${hotel?.slug}/${number}`;

  const downloadAll = async () => {
    if (!hotel || rooms.length === 0) return;
    setDownloading(true);
    try {
      await downloadRoomQrPdf({ hotelName: hotel.name, rooms, urlFor });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <Link
        href="/admin/hotels"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> All hotels
      </Link>

      <PageHeader
        title={hotel?.name ?? "Hotel"}
        description={
          hotel ? `/${hotel.slug} · ${rooms.length} rooms` : undefined
        }
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" /> Add room
            </Button>
            <Button
              onClick={downloadAll}
              loading={downloading}
              disabled={rooms.length === 0}
            >
              <Download className="h-4 w-4" /> Download QR PDF
            </Button>
          </div>
        }
      />

      {roomsQ.isLoading ? (
        <CenteredSpinner />
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={<DoorOpen className="h-10 w-10" />}
          title="No rooms"
          description="Add a room to this hotel."
        />
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">
          {rooms.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-slate-100 bg-white p-2.5 shadow-sm lg:p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xl font-bold text-slate-900">
                    {r.number}
                  </p>
                  <p className="text-xs text-slate-400">Floor {r.floor}</p>
                </div>
                <button
                  onClick={() => toggleRoom.mutate(r)}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    r.active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {r.active ? "On" : "Off"}
                </button>
              </div>
              <div className="mt-3 flex gap-1">
                <button
                  onClick={() => setQrRoom(r)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  <QrCode className="h-4 w-4" /> QR
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete room ${r.number}?`))
                      deleteRoom.mutate(r.id);
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

      {adding && hotel && (
        <AddRoomForm
          hotelId={hotelId}
          onClose={() => setAdding(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["rooms", hotelId] });
            qc.invalidateQueries({ queryKey: ["hotels"] });
            setAdding(false);
          }}
        />
      )}

      {qrRoom && hotel && (
        <Modal
          open
          onClose={() => setQrRoom(null)}
          title={`Room ${qrRoom.number} — QR`}
        >
          <QrView url={urlFor(qrRoom.number)} number={qrRoom.number} />
        </Modal>
      )}
    </div>
  );
}

function QrView({ url, number }: { url: string; number: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const download = () => {
    const canvas = wrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `room-${number}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
  return (
    <div className="flex flex-col items-center gap-2.5 lg:gap-5">
      <div ref={wrapRef} className="rounded-2xl border border-slate-200 p-2.5 lg:p-5">
        <QRCodeCanvas value={url} size={200} level="M" includeMargin />
      </div>
      <code className="w-full break-all rounded-lg bg-slate-50 px-3 py-2 text-center text-xs text-slate-500">
        {url}
      </code>
      <Button className="w-full" onClick={download}>
        <Download className="h-4 w-4" /> Download PNG
      </Button>
    </div>
  );
}

function AddRoomForm({
  hotelId,
  onClose,
  onSaved,
}: {
  hotelId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [number, setNumber] = useState("");
  const [floor, setFloor] = useState("1");
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      api.post("/api/rooms", {
        hotelId,
        number,
        floor: parseInt(floor) || 0,
        name: `Room ${number}`,
      }),
    onSuccess: onSaved,
    onError: (e: Error) => setError(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!number.trim()) return setError("Room number is required");
    save.mutate();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Add room"
      footer={
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" loading={save.isPending} onClick={submit}>
            Add room
          </Button>
        </div>
      }
    >
      <form onSubmit={submit} className="grid grid-cols-2 gap-2.5 lg:gap-5">
        <div>
          <Label>Room number</Label>
          <Input
            autoFocus
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="412"
          />
        </div>
        <div>
          <Label>Floor</Label>
          <Input
            type="number"
            min={0}
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
          />
        </div>
        {error && (
          <p className="col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
