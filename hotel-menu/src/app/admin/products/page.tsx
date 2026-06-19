"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Pencil, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  Button,
  CenteredSpinner,
  EmptyState,
  Input,
  Label,
  Modal,
  Textarea,
} from "@/components/ui";
import { api } from "@/lib/client-api";
import { formatPrice, parsePrice } from "@/lib/utils";
import { LANGS, LANG_LABEL, type Lang } from "@/lib/i18n";
import type { CategoryDTO, ProductDTO } from "@/types";

export default function ProductsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ProductDTO | null>(null);
  const [creating, setCreating] = useState(false);

  const productsQ = useQuery({
    queryKey: ["products"],
    queryFn: () => api.get<ProductDTO[]>("/api/products"),
  });
  const categoriesQ = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<CategoryDTO[]>("/api/categories"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.del(`/api/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  const toggleMut = useMutation({
    mutationFn: (p: ProductDTO) =>
      api.patch(`/api/products/${p.id}`, { available: !p.available }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  const grouped = useMemo(() => {
    const cats = categoriesQ.data ?? [];
    const products = productsQ.data ?? [];
    return cats
      .map((c) => ({
        category: c,
        items: products.filter((p) => p.categoryId === c.id),
      }))
      .filter((g) => g.items.length > 0);
  }, [categoriesQ.data, productsQ.data]);

  const categories = categoriesQ.data ?? [];

  return (
    <div>
      <PageHeader
        title="Products"
        description="Add, edit and manage your menu items."
        action={
          <Button
            onClick={() => setCreating(true)}
            disabled={categories.length === 0}
          >
            <Plus className="h-4 w-4" /> Add product
          </Button>
        }
      />

      {categories.length === 0 && !categoriesQ.isLoading && (
        <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Create a category first before adding products.
        </div>
      )}

      {productsQ.isLoading ? (
        <CenteredSpinner label="Loading products…" />
      ) : grouped.length === 0 ? (
        <EmptyState
          icon={<UtensilsCrossed className="h-10 w-10" />}
          title="No products yet"
          description="Add your first menu item to get started."
        />
      ) : (
        <div className="space-y-8">
          {grouped.map(({ category, items }) => (
            <section key={category.id}>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">
                {category.name}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((p) => (
                  <div
                    key={p.id}
                    className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
                  >
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt={p.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-300">
                          <UtensilsCrossed className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate font-semibold text-slate-900">
                          {p.name}
                        </h3>
                        <span className="whitespace-nowrap font-bold text-slate-900">
                          {formatPrice(p.price)}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-xs text-slate-500">
                        {p.description || "—"}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <button
                          onClick={() => toggleMut.mutate(p)}
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            p.available
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {p.available ? "Available" : "Hidden"}
                        </button>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditing(p)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${p.name}"?`))
                                deleteMut.mutate(p.id);
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <ProductForm
          product={editing}
          categories={categories}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["products"] });
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------ Product form ------------------------------ */

function ProductForm({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: ProductDTO | null;
  categories: CategoryDTO[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(product);
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [sourceLang, setSourceLang] = useState<Lang>(
    product?.sourceLang ?? "en"
  );
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [categoryId, setCategoryId] = useState(
    product?.categoryId ?? categories[0]?.id ?? ""
  );
  const [available, setAvailable] = useState(product?.available ?? true);
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name,
        description,
        sourceLang,
        price: parsePrice(price),
        imageUrl,
        categoryId,
        available,
      };
      return isEdit
        ? api.patch(`/api/products/${product!.id}`, payload)
        : api.post("/api/products", payload);
    },
    onSuccess: onSaved,
    onError: (e: Error) => setError(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Name is required");
    if (!categoryId) return setError("Choose a category");
    save.mutate();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Edit product" : "New product"}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            loading={save.isPending}
            onClick={submit}
          >
            {isEdit ? "Save changes" : "Create product"}
          </Button>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {imageUrl && (
          <div className="relative h-36 w-full overflow-hidden rounded-xl bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="preview"
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div>
          <Label>Input language</Label>
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value as Lang)}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          >
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {LANG_LABEL[l]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400">
            Enter the item in one language — the others are translated
            automatically on save.
          </p>
        </div>
        <div>
          <Label>Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Grilled Salmon"
          />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description shown to guests"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Price (UZS)</Label>
            <Input
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="150000"
            />
          </div>
          <div>
            <Label>Category</Label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <Label>Image URL</Label>
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Available for ordering
        </label>

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
