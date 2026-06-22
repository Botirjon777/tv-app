import { prisma } from "@/lib/prisma";
import { hotelInput } from "@/lib/validation";
import { fail, handle, ok, unauthorized } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { generateRooms, RESERVED_SLUGS, slugify } from "@/lib/slug";

// GET /api/hotels — staff (admin + pos). Includes room counts.
export async function GET() {
  return handle(async () => {
    if (!(await requireRole(["pos", "admin"]))) return unauthorized();
    const hotels = await prisma.hotel.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { rooms: true } } },
    });
    return ok(hotels.map(toHotelDTO));
  });
}

// Shared DTO shape for hotels — keeps branding fields in one place.
function toHotelDTO(h: {
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
  _count?: { rooms: number };
}) {
  return {
    id: h.id,
    name: h.name,
    slug: h.slug,
    floors: h.floors,
    roomsPerFloor: h.roomsPerFloor,
    active: h.active,
    logoUrl: h.logoUrl,
    tripadvisorUrl: h.tripadvisorUrl,
    googleMapsUrl: h.googleMapsUrl,
    yandexMapsUrl: h.yandexMapsUrl,
    wifiName: h.wifiName,
    wifiPassword: h.wifiPassword,
    instagramUrl: h.instagramUrl,
    telegramUrl: h.telegramUrl,
    roomCount: h._count?.rooms,
  };
}

// Find a slug that isn't reserved and isn't already taken.
async function resolveSlug(desired: string): Promise<string | null> {
  let base = slugify(desired);
  if (!base) return null;
  if (RESERVED_SLUGS.has(base)) base = `${base}-hotel`;
  let candidate = base;
  let n = 2;
  // Loop until we find a free slug.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await prisma.hotel.findUnique({ where: { slug: candidate } });
    if (!exists) return candidate;
    candidate = `${base}-${n++}`;
  }
}

// POST /api/hotels — admin. Creates the hotel and auto-generates its rooms.
export async function POST(req: Request) {
  return handle(async () => {
    if (!(await requireRole(["admin"]))) return unauthorized();
    const body = await req.json().catch(() => ({}));
    const data = hotelInput.parse(body);

    const slug = await resolveSlug(data.slug || data.name);
    if (!slug) return fail("Could not derive a valid slug from the name", 422);

    const rooms = generateRooms(data.floors, data.roomsPerFloor);

    const { name, floors, roomsPerFloor, slug: _slug, ...branding } = data;

    const hotel = await prisma.hotel.create({
      data: {
        name,
        slug,
        floors,
        roomsPerFloor,
        ...branding,
        rooms: { create: rooms },
      },
      include: { _count: { select: { rooms: true } } },
    });

    return ok(toHotelDTO(hotel), 201);
  });
}
