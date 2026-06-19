"use client";

import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { GripVertical, Pencil, Plus, Tags, Trash2 } from "lucide-react";
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
import { LANGS, LANG_LABEL, type Lang } from "@/lib/i18n";
import type { CategoryDTO, ProductDTO } from "@/types";

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<CategoryDTO | null>(null);
  const [creating, setCreating] = useState(false);

  const categoriesQ = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<CategoryDTO[]>("/api/categories"),
  });
  const productsQ = useQuery({
    queryKey: ["products"],
    queryFn: () => api.get<ProductDTO[]>("/api/products"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.del(`/api/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const countFor = (categoryId: string) =>
    (productsQ.data ?? []).filter((p) => p.categoryId === categoryId).length;

  const categories = categoriesQ.data ?? [];

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organize your menu into sections."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Add category
          </Button>
        }
      />

      {categoriesQ.isLoading ? (
        <CenteredSpinner />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={<Tags className="h-10 w-10" />}
          title="No categories"
          description="Create sections like Breakfast, Mains or Drinks."
        />
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {categories.map((c) => {
            const count = countFor(c.id);
            return (
              <li
                key={c.id}
                className="flex items-center gap-3 px-2.5 py-2.5 lg:px-5 lg:py-5"
              >
                <GripVertical className="h-4 w-4 text-slate-300" />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="text-xs text-slate-400">
                    {count} {count === 1 ? "product" : "products"}
                  </p>
                </div>
                <button
                  onClick={() => setEditing(c)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    const msg =
                      count > 0
                        ? `Delete "${c.name}" and its ${count} product(s)?`
                        : `Delete "${c.name}"?`;
                    if (confirm(msg)) deleteMut.mutate(c.id);
                  }}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {(creating || editing) && (
        <CategoryForm
          category={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["categories"] });
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function CategoryForm({
  category,
  onClose,
  onSaved,
}: {
  category: CategoryDTO | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(category);
  const [name, setName] = useState(category?.name ?? "");
  const [sourceLang, setSourceLang] = useState<Lang>(
    category?.sourceLang ?? "en"
  );
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      isEdit
        ? api.patch(`/api/categories/${category!.id}`, { name, sourceLang })
        : api.post("/api/categories", { name, sourceLang }),
    onSuccess: onSaved,
    onError: (e: Error) => setError(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Name is required");
    save.mutate();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Edit category" : "New category"}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" loading={save.isPending} onClick={submit}>
            {isEdit ? "Save" : "Create"}
          </Button>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-2.5 lg:space-y-5">
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
            Other languages are translated automatically on save.
          </p>
        </div>
        <div>
          <Label>Category name</Label>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Breakfast"
          />
        </div>
        {error && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
