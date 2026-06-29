"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, DoorOpen, Plus, QrCode, Trash2 } from "lucide-react";
import { api } from "@/lib/client-api";
import {
  Button,
  CenteredSpinner,
  EmptyState,
  Input,
  Label,
  Modal,
} from "@/components/ui";
import { downloadRoomQrPdf } from "@/lib/qrpdf";
import type { RoomDTO } from "@/types";

function baseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_BASE_URL ?? "";
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomDTO[]>([]);
  const [slug, setSlug] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [qrRoom, setQrRoom] = useState<RoomDTO | null>(null);
  const [downloading, setDownloading] = useState(false);

  const load = () => {
    Promise.all([
      api.get<{ slug: string; name: string }>("/api/dashboard/hotel"),
      api.get<RoomDTO[]>("/api/dashboard/rooms"),
    ])
      .then(([h, r]) => {
        setSlug(h.slug);
        setHotelName(h.name);
        setRooms(r);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const urlFor = (number: string) => `${baseUrl()}/${slug}/${number}`;

  const toggle = async (r: RoomDTO) => {
    await api.patch(`/api/dashboard/rooms/${r.id}`, { active: !r.active });
    load();
  };
  const remove = async (r: RoomDTO) => {
    if (!confirm(`Delete room ${r.number}?`)) return;
    try {
      await api.del(`/api/dashboard/rooms/${r.id}`);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  };
  const downloadAll = async () => {
    if (rooms.length === 0) return;
    setDownloading(true);
    try {
      await downloadRoomQrPdf({ hotelName, rooms, urlFor });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <CenteredSpinner label="Loading rooms…" />;

  return (
    <div>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Rooms & QR codes</h2>
          <p className="mt-1 text-sm text-slate-500">
            Each room&apos;s QR opens its in-room menu.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Add room
          </Button>
          <Button
            onClick={downloadAll}
            loading={downloading}
            disabled={rooms.length === 0}
          >
            <Download className="h-4 w-4" /> QR PDF
          </Button>
        </div>
      </div>

      {rooms.length === 0 ? (
        <EmptyState
          icon={<DoorOpen className="h-10 w-10" />}
          title="No rooms"
          description="Add a room to generate its QR code."
        />
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {rooms.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xl font-bold text-slate-900">{r.number}</p>
                  <p className="text-xs text-slate-400">Floor {r.floor}</p>
                </div>
                <button
                  onClick={() => toggle(r)}
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
                  onClick={() => remove(r)}
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

      {adding && (
        <AddRoomForm
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            load();
          }}
        />
      )}
      {qrRoom && (
        <Modal open onClose={() => setQrRoom(null)} title={`Room ${qrRoom.number} — QR`}>
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
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [number, setNumber] = useState("");
  const [floor, setFloor] = useState("1");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!number.trim()) return setError("Room number is required");
    setSaving(true);
    setError(null);
    try {
      await api.post("/api/dashboard/rooms", {
        number,
        floor: parseInt(floor) || 0,
        name: `Room ${number}`,
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
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
          <Button className="flex-1" loading={saving} onClick={submit}>
            Add room
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3">
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
      </div>
    </Modal>
  );
}
