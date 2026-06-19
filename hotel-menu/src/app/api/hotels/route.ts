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
    return ok(
      hotels.map((h) => ({
        id: h.id,
        name: h.name,
        slug: h.slug,
        floors: h.floors,
        roomsPerFloor: h.roomsPerFloor,
        active: h.active,
        roomCount: h._count.rooms,
      }))
    );
  });
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

    const hotel = await prisma.hotel.create({
      data: {
        name: data.name,
        slug,
        floors: data.floors,
        roomsPerFloor: data.roomsPerFloor,
        rooms: { create: rooms },
      },
      include: { _count: { select: { rooms: true } } },
    });

    return ok(
      {
        id: hotel.id,
        name: hotel.name,
        slug: hotel.slug,
        floors: hotel.floors,
        roomsPerFloor: hotel.roomsPerFloor,
        active: hotel.active,
        roomCount: hotel._count.rooms,
      },
      201
    );
  });
}
