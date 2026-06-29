import { parseI18n, type Lang } from "@/lib/i18n";
import type {
  CategoryDTO,
  ProductDTO,
  RecommendationDTO,
  ServiceDTO,
} from "@/types";

type ServiceRow = {
  id: string;
  name: string;
  sourceLang: string;
  nameI18n: string;
  description: string;
  descI18n: string;
  icon: string;
  imageUrl: string;
  price: number;
  sortOrder: number;
  active: boolean;
};

export function serializeService(s: ServiceRow): ServiceDTO {
  return {
    id: s.id,
    name: s.name,
    sourceLang: s.sourceLang as Lang,
    nameI18n: parseI18n(s.nameI18n),
    description: s.description,
    descI18n: parseI18n(s.descI18n),
    icon: s.icon,
    imageUrl: s.imageUrl,
    price: s.price,
    sortOrder: s.sortOrder,
    active: s.active,
  };
}

type CategoryRow = {
  id: string;
  name: string;
  sourceLang: string;
  nameI18n: string;
  sortOrder: number;
};

type ProductRow = {
  id: string;
  name: string;
  description: string;
  sourceLang: string;
  nameI18n: string;
  descI18n: string;
  price: number;
  imageUrl: string;
  available: boolean;
  sortOrder: number;
  categoryId: string;
  category?: { name: string } | null;
};

export function serializeCategory(c: CategoryRow): CategoryDTO {
  return {
    id: c.id,
    name: c.name,
    sourceLang: c.sourceLang as Lang,
    nameI18n: parseI18n(c.nameI18n),
    sortOrder: c.sortOrder,
  };
}

export function serializeRecommendation(r: {
  id: string;
  dayOfWeek: number;
  sortOrder: number;
  product: ProductRow;
}): RecommendationDTO {
  return {
    id: r.id,
    dayOfWeek: r.dayOfWeek,
    sortOrder: r.sortOrder,
    product: serializeProduct(r.product),
  };
}

export function serializeProduct(p: ProductRow): ProductDTO {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    sourceLang: p.sourceLang as Lang,
    nameI18n: parseI18n(p.nameI18n),
    descI18n: parseI18n(p.descI18n),
    price: p.price,
    imageUrl: p.imageUrl,
    available: p.available,
    sortOrder: p.sortOrder,
    categoryId: p.categoryId,
    categoryName: p.category?.name ?? "",
  };
}
