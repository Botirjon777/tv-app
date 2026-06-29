"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import {
  Button,
  CenteredSpinner,
  EmptyState,
  Input,
  Label,
  Modal,
  Select,
} from "@/components/ui";
import { formatPrice, parsePrice } from "@/lib/utils";
import { LANGS, LANG_LABEL, type Lang } from "@/lib/i18n";
import {
  useCategories,
  useCategoryMutations,
  useProducts,
  useProductMutations,
} from "@/hooks/dashboard";
import type { CategoryDTO, ProductDTO } from "@/types";

export default function MenuPage() {
  const { data: categories = [], isLoading: catLoading } = useCategories();
  const { data: products = [], isLoading: prodLoading } = useProducts();
  const { remove: removeCategory } = useCategoryMutations();
  const { update: updateProduct, remove: removeProduct } = useProductMutations();
  const [catForm, setCatForm] = useState<CategoryDTO | "new" | null>(null);
  const [prodForm, setProdForm] = useState<ProductDTO | { categoryId: string } | null>(
    null
  );

  const byCategory = useMemo(() => {
    const map: Record<string, ProductDTO[]> = {};
    for (const p of products) (map[p.categoryId] ??= []).push(p);
    return map;
  }, [products]);

  const delCategory = (c: CategoryDTO) => {
    if (!confirm(`Delete "${c.name}" and its products?`)) return;
    removeCategory.mutate(c.id);
  };
  const delProduct = (p: ProductDTO) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    removeProduct.mutate(p.id);
  };
  const toggleProduct = (p: ProductDTO) =>
    updateProduct.mutate({ id: p.id, data: { available: !p.available } });

  if (catLoading || prodLoading) return <CenteredSpinner label="Loading menu…" />;

  return (
    <div>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Menu</h2>
          <p className="mt-1 text-sm text-slate-500">
            Your categories, products and prices. Text is auto-translated to
            en/ru/uz.
          </p>
        </div>
        <Button onClick={() => setCatForm("new")}>
          <Plus className="h-4 w-4" /> Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={<UtensilsCrossed className="h-10 w-10" />}
          title="No categories yet"
          description="Add a category, then add products to it."
        />
      ) : (
        <div className="space-y-5">
          {categories.map((c) => (
            <section
              key={c.id}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm lg:p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">{c.name}</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setProdForm({ categoryId: c.id })}
                    className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    + Product
                  </button>
                  <button
                    onClick={() => setCatForm(c)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Edit category"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => delCategory(c)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Delete category"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {(byCategory[c.id] ?? []).length === 0 ? (
                <p className="py-2 text-sm text-slate-400">No products yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {(byCategory[c.id] ?? []).map((p) => (
                    <li key={p.id} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-900">
                          {p.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {formatPrice(p.price)}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleProduct(p)}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          p.available
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {p.available ? "Available" : "Hidden"}
                      </button>
                      <button
                        onClick={() => setProdForm(p)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Edit product"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => delProduct(p)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Delete product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      {catForm && (
        <CategoryForm
          category={catForm === "new" ? null : catForm}
          onClose={() => setCatForm(null)}
          onSaved={() => setCatForm(null)}
        />
      )}
      {prodForm && (
        <ProductForm
          product={"id" in prodForm ? prodForm : null}
          categoryId={"id" in prodForm ? prodForm.categoryId : prodForm.categoryId}
          categories={categories}
          onClose={() => setProdForm(null)}
          onSaved={() => setProdForm(null)}
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
  const { create, update } = useCategoryMutations();
  const [name, setName] = useState(category?.name ?? "");
  const [sourceLang, setSourceLang] = useState<Lang>(category?.sourceLang ?? "en");
  const [error, setError] = useState<string | null>(null);
  const saving = create.isPending || update.isPending;

  const submit = async () => {
    if (!name.trim()) return setError("Name is required");
    setError(null);
    const body = { name, sourceLang };
    try {
      if (isEdit) await update.mutateAsync({ id: category!.id, data: body });
      else await create.mutateAsync(body);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    }
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
            placeholder="Breakfast"
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

function ProductForm({
  product,
  categoryId,
  categories,
  onClose,
  onSaved,
}: {
  product: ProductDTO | null;
  categoryId: string;
  categories: CategoryDTO[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(product);
  const { create, update } = useProductMutations();
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [catId, setCatId] = useState(product?.categoryId ?? categoryId);
  const [sourceLang, setSourceLang] = useState<Lang>(product?.sourceLang ?? "en");
  const [error, setError] = useState<string | null>(null);
  const saving = create.isPending || update.isPending;

  const submit = async () => {
    if (!name.trim()) return setError("Name is required");
    setError(null);
    const body = {
      name,
      description,
      price: parsePrice(price),
      imageUrl,
      categoryId: catId,
      sourceLang,
    };
    try {
      if (isEdit) await update.mutateAsync({ id: product!.id, data: body });
      else await create.mutateAsync(body);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    }
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
            placeholder="Caesar Salad"
          />
        </div>
        <div>
          <Label>Description</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Romaine, parmesan, croutons…"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Price (UZS)</Label>
            <Input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="140000"
            />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={catId} onChange={(e) => setCatId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
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
