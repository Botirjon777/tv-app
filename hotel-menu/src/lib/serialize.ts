import type { OrderStatus } from "@/lib/orders";
import type { OrderDTO } from "@/types";

// Prisma's Order with room + items included. Kept loose to avoid a hard
// dependency on generated types in places that only need the shape.
type OrderWithRelations = {
  id: string;
  roomId: string;
  status: string;
  note: string;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  room?: {
    number: string;
    hotelId?: string;
    hotel?: { id: string; slug: string; name: string } | null;
  } | null;
  items: {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
};

export function serializeOrder(order: OrderWithRelations): OrderDTO {
  return {
    id: order.id,
    roomId: order.roomId,
    roomNumber: order.room?.number ?? "?",
    hotelId: order.room?.hotel?.id ?? "",
    hotelSlug: order.room?.hotel?.slug ?? "",
    hotelName: order.room?.hotel?.name ?? "",
    status: order.status as OrderStatus,
    note: order.note,
    total: order.total,
    items: order.items.map((it) => ({
      id: it.id,
      productId: it.productId,
      name: it.name,
      price: it.price,
      quantity: it.quantity,
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

// Standard include used everywhere an OrderDTO is built.
export const orderInclude = {
  room: {
    select: {
      number: true,
      hotelId: true,
      hotel: { select: { id: true, slug: true, name: true } },
    },
  },
  items: true,
} as const;
