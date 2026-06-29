import { prisma } from "@/lib/prisma";
import { parseI18n, type Lang } from "@/lib/i18n";
import { resolveHotelAsset } from "@/lib/hotel-assets";
import { serializeService } from "@/lib/serialize-menu";
import type { LandingHotel } from "@/components/client/RoomLanding";
import type { MenuCategoryDTO, ProductDTO, ServiceDTO } from "@/types";

type RoomRef = { id: string; number: string; name: string };

// Resolve an active room within an active hotel. Returns null if either is
// missing/inactive (the caller renders RoomNotAvailable).
async function findActiveRoom(slug: string, number: string) {
  const hotel = await prisma.hotel.findUnique({ where: { slug } });
  if (!hotel || !hotel.active) return null;
  const room = await prisma.room.findUnique({
    where: { hotelId_number: { hotelId: hotel.id, number } },
  });
  if (!room || !room.active) return null;
  return { hotel, room };
}

function toRoomRef(room: { id: string; number: string; name: string }): RoomRef {
  return { id: room.id, number: room.number, name: room.name };
}

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
};

function toProductDTO(p: ProductRow): ProductDTO {
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
  };
}

// Landing route: hotel branding (incl. public/<slug>/ banner + logo) and room.
export async function loadRoomLanding(
  slug: string,
  number: string
): Promise<{
  hotel: LandingHotel;
  room: RoomRef;
  services: ServiceDTO[];
} | null> {
  const found = await findActiveRoom(slug, number);
  if (!found) return null;
  const { hotel, room } = found;

  const services = await prisma.hotelService.findMany({
    where: { hotelId: hotel.id, active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return {
    hotel: {
      slug: hotel.slug,
      name: hotel.name,
      imageUrl: resolveHotelAsset(hotel.slug, "banner"),
      logoUrl: resolveHotelAsset(hotel.slug, "logo") || hotel.logoUrl,
      tripadvisorUrl: hotel.tripadvisorUrl,
      googleMapsUrl: hotel.googleMapsUrl,
      yandexMapsUrl: hotel.yandexMapsUrl,
      wifiName: hotel.wifiName,
      wifiPassword: hotel.wifiPassword,
      instagramUrl: hotel.instagramUrl,
      telegramUrl: hotel.telegramUrl,
    },
    room: toRoomRef(room),
    services: services.map(serializeService),
  };
}

// Menu route: hotel identity, room, the full menu, and today's recommendations.
export async function loadRoomMenu(
  slug: string,
  number: string
): Promise<{
  hotel: {
    slug: string;
    name: string;
    serviceFeeType: string;
    serviceFeeValue: number;
    preorderEnabled: boolean;
  };
  room: RoomRef;
  menu: MenuCategoryDTO[];
  recommendations: ProductDTO[];
} | null> {
  const found = await findActiveRoom(slug, number);
  if (!found) return null;
  const { hotel, room } = found;

  const categories = await prisma.category.findMany({
    where: { hotelId: hotel.id },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      products: {
        where: { available: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });

  const menu: MenuCategoryDTO[] = categories
    .filter((c) => c.products.length > 0)
    .map((c) => ({
      id: c.id,
      name: c.name,
      sourceLang: c.sourceLang as Lang,
      nameI18n: parseI18n(c.nameI18n),
      sortOrder: c.sortOrder,
      products: c.products.map(toProductDTO),
    }));

  // Today's "recommendation of the day" (0=Sunday … 6=Saturday, server local).
  const today = new Date().getDay();
  const recs = await prisma.recommendation.findMany({
    where: { hotelId: hotel.id, dayOfWeek: today, product: { available: true } },
    orderBy: { sortOrder: "asc" },
    include: { product: true },
  });
  const recommendations: ProductDTO[] = recs.map((r) => toProductDTO(r.product));

  return {
    hotel: {
      slug: hotel.slug,
      name: hotel.name,
      serviceFeeType: hotel.serviceFeeType,
      serviceFeeValue: hotel.serviceFeeValue,
      preorderEnabled: hotel.preorderEnabled,
    },
    room: toRoomRef(room),
    menu,
    recommendations,
  };
}
