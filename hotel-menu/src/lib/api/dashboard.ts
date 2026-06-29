import { api } from "@/lib/client-api";
import type {
  CategoryDTO,
  ProductDTO,
  RecommendationDTO,
  RoomDTO,
  ServiceDTO,
} from "@/types";

/** The manager's hotel + setup status, as returned by GET /api/dashboard/hotel. */
export type DashboardHotel = {
  id: string;
  name: string;
  slug: string;
  connectCode: string;
  serviceFeeType: "none" | "percent" | "fixed";
  serviceFeeValue: number;
  preorderEnabled: boolean;
  instagramUrl: string;
  telegramUrl: string;
  telegramLinked: boolean;
  logoUrl: string;
  wifiName: string;
  wifiPassword: string;
  serviceCount: number;
  productCount: number;
  roomCount: number;
  orderCount: number;
  activeOrderCount: number;
};

export type HotelSettingsUpdate = Partial<{
  serviceFeeType: "none" | "percent" | "fixed";
  serviceFeeValue: number;
  preorderEnabled: boolean;
  instagramUrl: string;
  telegramUrl: string;
  wifiName: string;
  wifiPassword: string;
  logoUrl: string;
}>;

const B = "/api/dashboard";

// All request functions for the manager dashboard live here, grouped by domain.
// Components never call fetch/`api` directly — they go through the hooks in
// src/hooks/dashboard.ts, which call these.
export const dashboardApi = {
  // Hotel + settings
  getHotel: () => api.get<DashboardHotel>(`${B}/hotel`),
  updateHotel: (data: HotelSettingsUpdate) => api.patch(`${B}/hotel`, data),

  // Services
  listServices: () => api.get<ServiceDTO[]>(`${B}/services`),
  createService: (data: unknown) => api.post<ServiceDTO>(`${B}/services`, data),
  updateService: (id: string, data: unknown) =>
    api.patch<ServiceDTO>(`${B}/services/${id}`, data),
  deleteService: (id: string) => api.del(`${B}/services/${id}`),

  // Menu — categories
  listCategories: () => api.get<CategoryDTO[]>(`${B}/menu/categories`),
  createCategory: (data: unknown) =>
    api.post<CategoryDTO>(`${B}/menu/categories`, data),
  updateCategory: (id: string, data: unknown) =>
    api.patch<CategoryDTO>(`${B}/menu/categories/${id}`, data),
  deleteCategory: (id: string) => api.del(`${B}/menu/categories/${id}`),

  // Menu — products
  listProducts: () => api.get<ProductDTO[]>(`${B}/menu/products`),
  createProduct: (data: unknown) =>
    api.post<ProductDTO>(`${B}/menu/products`, data),
  updateProduct: (id: string, data: unknown) =>
    api.patch<ProductDTO>(`${B}/menu/products/${id}`, data),
  deleteProduct: (id: string) => api.del(`${B}/menu/products/${id}`),

  // Recommendations
  listRecommendations: () =>
    api.get<RecommendationDTO[]>(`${B}/menu/recommendations`),
  createRecommendation: (data: { dayOfWeek: number; productId: string }) =>
    api.post<RecommendationDTO>(`${B}/menu/recommendations`, data),
  deleteRecommendation: (id: string) =>
    api.del(`${B}/menu/recommendations/${id}`),

  // Rooms
  listRooms: () => api.get<RoomDTO[]>(`${B}/rooms`),
  createRoom: (data: unknown) => api.post<RoomDTO>(`${B}/rooms`, data),
  updateRoom: (id: string, data: unknown) =>
    api.patch<RoomDTO>(`${B}/rooms/${id}`, data),
  deleteRoom: (id: string) => api.del(`${B}/rooms/${id}`),
};
