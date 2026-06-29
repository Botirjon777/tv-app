"use client";

import { useEffect, useState } from "react";
import { Hotel, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/client-api";
import {
  Button,
  CenteredSpinner,
  EmptyState,
  Input,
  Label,
  Modal,
  Select,
} from "@/components/ui";
import { LANGS, LANG_LABEL, type Lang } from "@/lib/i18n";
import { formatPrice, parsePrice } from "@/lib/utils";
import type { ServiceDTO } from "@/types";

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ServiceDTO | null>(null);
  const [adding, setAdding] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get<ServiceDTO[]>("/api/dashboard/services")
      .then(setServices)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async (s: ServiceDTO) => {
    if (!confirm(`Delete "${s.name}"?`)) return;
    await api.del(`/api/dashboard/services/${s.id}`);
    load();
  };

  const toggle = async (s: ServiceDTO) => {
    await api.patch(`/api/dashboard/services/${s.id}`, { active: !s.active });
    load();
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Hotel services</h2>
          <p className="mt-1 text-sm text-slate-500">
            Airport transfer, pool, conference hall… shown to guests in-room.
          </p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> Add service
        </Button>
      </div>

      {loading ? (
        <CenteredSpinner />
      ) : services.length === 0 ? (
        <EmptyState
          icon={<Hotel className="h-10 w-10" />}
          title="No services yet"
          description="Add the services your hotel offers."
        />
      ) : (
        <ul className="space-y-2.5">
          {services.map((s) => (
            <li
              key={s.id}
              className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              {s.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.imageUrl}
                  alt={s.name}
                  className="h-12 w-12 flex-shrink-0 rounded-xl object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{s.name}</p>
                {s.description && (
                  <p className="mt-0.5 text-sm text-slate-500">{s.description}</p>
                )}
                {s.price > 0 && (
                  <p className="mt-0.5 text-sm font-medium text-slate-700">
                    {formatPrice(s.price)}
                  </p>
                )}
              </div>
              <button
                onClick={() => toggle(s)}
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  s.active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {s.active ? "Shown" : "Hidden"}
              </button>
              <button
                onClick={() => setEditing(s)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => remove(s)}
                className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {(adding || editing) && (
        <ServiceForm
          service={editing}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSaved={() => {
            setAdding(false);
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function ServiceForm({
  service,
  onClose,
  onSaved,
}: {
  service: ServiceDTO | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(service);
  const [name, setName] = useState(service?.name ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [price, setPrice] = useState(String(service?.price || ""));
  const [imageUrl, setImageUrl] = useState(service?.imageUrl ?? "");
  const [sourceLang, setSourceLang] = useState<Lang>(service?.sourceLang ?? "en");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) return setError("Name is required");
    setSaving(true);
    setError(null);
    try {
      const body = {
        name,
        description,
        price: parsePrice(price),
        imageUrl,
        sourceLang,
      };
      if (isEdit) await api.patch(`/api/dashboard/services/${service!.id}`, body);
      else await api.post("/api/dashboard/services", body);
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
      title={isEdit ? "Edit service" : "Add service"}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" loading={saving} onClick={submit}>
            {isEdit ? "Save" : "Add"}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div>
          <Label>Name</Label>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Airport transfer"
          />
        </div>
        <div>
          <Label>Description (optional)</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Door-to-door car to the airport"
          />
        </div>
        <div>
          <Label>Price (UZS, optional)</Label>
          <Input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Leave empty for no price"
          />
        </div>
        <div>
          <Label>Image URL (optional)</Label>
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div>
          <Label>Language you typed in</Label>
          <Select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value as Lang)}
          >
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {LANG_LABEL[l]}
              </option>
            ))}
          </Select>
          <p className="mt-1 text-xs text-slate-400">
            We translate it to the other languages automatically.
          </p>
        </div>
        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
