"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardApi, type HotelSettingsUpdate } from "@/lib/api/dashboard";

// Stable query keys for the manager dashboard. Mutations invalidate these so
// every consumer of a list refetches automatically after a change.
export const dashboardKeys = {
  hotel: ["dashboard", "hotel"] as const,
  services: ["dashboard", "services"] as const,
  categories: ["dashboard", "categories"] as const,
  products: ["dashboard", "products"] as const,
  recommendations: ["dashboard", "recommendations"] as const,
  rooms: ["dashboard", "rooms"] as const,
};

type IdData = { id: string; data: unknown };

/* --------------------------------- Hotel ---------------------------------- */

export function useDashboardHotel() {
  return useQuery({
    queryKey: dashboardKeys.hotel,
    queryFn: dashboardApi.getHotel,
  });
}

export function useUpdateHotel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: HotelSettingsUpdate) => dashboardApi.updateHotel(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: dashboardKeys.hotel }),
  });
}

/* -------------------------------- Services -------------------------------- */

export function useServices() {
  return useQuery({
    queryKey: dashboardKeys.services,
    queryFn: dashboardApi.listServices,
  });
}

export function useServiceMutations() {
  const qc = useQueryClient();
  const onSuccess = () =>
    qc.invalidateQueries({ queryKey: dashboardKeys.services });
  return {
    create: useMutation({
      mutationFn: (data: unknown) => dashboardApi.createService(data),
      onSuccess,
    }),
    update: useMutation({
      mutationFn: ({ id, data }: IdData) => dashboardApi.updateService(id, data),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: string) => dashboardApi.deleteService(id),
      onSuccess,
    }),
  };
}

/* ------------------------------- Categories ------------------------------- */

export function useCategories() {
  return useQuery({
    queryKey: dashboardKeys.categories,
    queryFn: dashboardApi.listCategories,
  });
}

export function useCategoryMutations() {
  const qc = useQueryClient();
  // Deleting a category cascades to its products, so refresh both lists.
  const onSuccess = () => {
    qc.invalidateQueries({ queryKey: dashboardKeys.categories });
    qc.invalidateQueries({ queryKey: dashboardKeys.products });
  };
  return {
    create: useMutation({
      mutationFn: (data: unknown) => dashboardApi.createCategory(data),
      onSuccess,
    }),
    update: useMutation({
      mutationFn: ({ id, data }: IdData) =>
        dashboardApi.updateCategory(id, data),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: string) => dashboardApi.deleteCategory(id),
      onSuccess,
    }),
  };
}

/* -------------------------------- Products -------------------------------- */

export function useProducts() {
  return useQuery({
    queryKey: dashboardKeys.products,
    queryFn: dashboardApi.listProducts,
  });
}

export function useProductMutations() {
  const qc = useQueryClient();
  // Products feed recommendations, so refresh those too.
  const onSuccess = () => {
    qc.invalidateQueries({ queryKey: dashboardKeys.products });
    qc.invalidateQueries({ queryKey: dashboardKeys.recommendations });
  };
  return {
    create: useMutation({
      mutationFn: (data: unknown) => dashboardApi.createProduct(data),
      onSuccess,
    }),
    update: useMutation({
      mutationFn: ({ id, data }: IdData) => dashboardApi.updateProduct(id, data),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: string) => dashboardApi.deleteProduct(id),
      onSuccess,
    }),
  };
}

/* ----------------------------- Recommendations ---------------------------- */

export function useRecommendations() {
  return useQuery({
    queryKey: dashboardKeys.recommendations,
    queryFn: dashboardApi.listRecommendations,
  });
}

export function useRecommendationMutations() {
  const qc = useQueryClient();
  const onSuccess = () =>
    qc.invalidateQueries({ queryKey: dashboardKeys.recommendations });
  return {
    create: useMutation({
      mutationFn: (data: { dayOfWeek: number; productId: string }) =>
        dashboardApi.createRecommendation(data),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: string) => dashboardApi.deleteRecommendation(id),
      onSuccess,
    }),
  };
}

/* ---------------------------------- Rooms --------------------------------- */

export function useRooms() {
  return useQuery({
    queryKey: dashboardKeys.rooms,
    queryFn: dashboardApi.listRooms,
  });
}

export function useRoomMutations() {
  const qc = useQueryClient();
  const onSuccess = () => {
    qc.invalidateQueries({ queryKey: dashboardKeys.rooms });
    qc.invalidateQueries({ queryKey: dashboardKeys.hotel }); // room count stat
  };
  return {
    create: useMutation({
      mutationFn: (data: unknown) => dashboardApi.createRoom(data),
      onSuccess,
    }),
    update: useMutation({
      mutationFn: ({ id, data }: IdData) => dashboardApi.updateRoom(id, data),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: string) => dashboardApi.deleteRoom(id),
      onSuccess,
    }),
  };
}
