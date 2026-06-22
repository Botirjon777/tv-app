import type { OrderStatus } from "@/lib/orders";
import type { I18nText, Lang } from "@/lib/i18n";

export type CategoryDTO = {
  id: string;
  name: string;
  sourceLang: Lang;
  nameI18n: I18nText;
  sortOrder: number;
};

export type ProductDTO = {
  id: string;
  name: string;
  description: string;
  sourceLang: Lang;
  nameI18n: I18nText;
  descI18n: I18nText;
  price: number; // integer UZS
  imageUrl: string;
  available: boolean;
  sortOrder: number;
  categoryId: string;
  categoryName?: string;
};

export type MenuCategoryDTO = CategoryDTO & {
  products: ProductDTO[];
};

export type RecommendationDTO = {
  id: string;
  dayOfWeek: number; // 0=Sunday … 6=Saturday
  sortOrder: number;
  product: ProductDTO;
};

export type HotelDTO = {
  id: string;
  name: string;
  slug: string;
  floors: number;
  roomsPerFloor: number;
  active: boolean;
  logoUrl: string;
  tripadvisorUrl: string;
  googleMapsUrl: string;
  yandexMapsUrl: string;
  wifiName: string;
  wifiPassword: string;
  instagramUrl: string;
  telegramUrl: string;
  roomCount?: number;
};

export type RoomDTO = {
  id: string;
  hotelId: string;
  number: string;
  name: string;
  floor: number;
  active: boolean;
};

export type OrderItemDTO = {
  id: string;
  productId: string;
  name: string;
  price: number; // unit price, minor units
  quantity: number;
};

export type OrderDTO = {
  id: string;
  roomId: string;
  roomNumber: string;
  hotelId: string;
  hotelSlug: string;
  hotelName: string;
  status: OrderStatus;
  note: string;
  total: number; // minor units
  items: OrderItemDTO[];
  createdAt: string;
  updatedAt: string;
};

// Shape of the cart held client-side (in localStorage).
export type CartItem = {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
};
