import { prisma } from "@/lib/prisma";
import { roomInput } from "@/lib/validation";
import { fail, handle, ok, unauthorized } from "@/lib/http";
import { managerHotelId } from "@/lib/session";

// GET /api/dashboard/rooms — the manager's hotel rooms.
export async function GET() {
  return handle(async () => {
    const hotelId = await managerHotelId();
    if (!hotelId) return unauthorized();
    const rooms = await prisma.room.findMany({
      where: { hotelId },
      orderBy: [{ floor: "asc" }, { number: "asc" }],
    });
    return ok(rooms);
  });
}

// POST — add a room to the manager's hotel.
export async function POST(req: Request) {
  return handle(async () => {
    const hotelId = await managerHotelId();
    if (!hotelId) return unauthorized();
    const data = roomInput.omit({ hotelId: true }).parse(
      await req.json().catch(() => ({}))
    );

    const dup = await prisma.room.findUnique({
      where: { hotelId_number: { hotelId, number: data.number } },
    });
    if (dup) return fail("That room number already exists", 409);

    const room = await prisma.room.create({ data: { hotelId, ...data } });
    return ok(room, 201);
  });
}
