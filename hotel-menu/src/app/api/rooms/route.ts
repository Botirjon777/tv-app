import { prisma } from "@/lib/prisma";
import { roomInput } from "@/lib/validation";
import { fail, handle, ok, unauthorized } from "@/lib/http";
import { requireRole } from "@/lib/session";

// GET /api/rooms?hotelId=... — admin only. hotelId is required.
export async function GET(req: Request) {
  return handle(async () => {
    if (!(await requireRole(["admin"]))) return unauthorized();
    const hotelId = new URL(req.url).searchParams.get("hotelId");
    if (!hotelId) return fail("hotelId is required", 400);
    const rooms = await prisma.room.findMany({
      where: { hotelId },
      orderBy: [{ floor: "asc" }, { number: "asc" }],
    });
    return ok(rooms);
  });
}

// POST /api/rooms — admin only. Add a single extra room to a hotel.
export async function POST(req: Request) {
  return handle(async () => {
    if (!(await requireRole(["admin"]))) return unauthorized();
    const body = await req.json().catch(() => ({}));
    const data = roomInput.parse(body);

    const hotel = await prisma.hotel.findUnique({ where: { id: data.hotelId } });
    if (!hotel) return fail("Hotel not found", 404);

    const dup = await prisma.room.findUnique({
      where: { hotelId_number: { hotelId: data.hotelId, number: data.number } },
    });
    if (dup) return fail("That room number already exists in this hotel", 409);

    const room = await prisma.room.create({ data });
    return ok(room, 201);
  });
}
