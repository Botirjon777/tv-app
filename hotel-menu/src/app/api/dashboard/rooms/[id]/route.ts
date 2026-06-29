import { prisma } from "@/lib/prisma";
import { roomUpdateInput } from "@/lib/validation";
import { fail, handle, notFound, ok, unauthorized } from "@/lib/http";
import { managerHotelId } from "@/lib/session";

type Params = { params: { id: string } };

// PATCH — rename/toggle one of the manager's rooms.
export async function PATCH(req: Request, { params }: Params) {
  return handle(async () => {
    const hotelId = await managerHotelId();
    if (!hotelId) return unauthorized();
    const existing = await prisma.room.findUnique({ where: { id: params.id } });
    if (!existing || existing.hotelId !== hotelId) return notFound("Room");

    const data = roomUpdateInput.parse(await req.json().catch(() => ({})));
    if (data.number && data.number !== existing.number) {
      const dup = await prisma.room.findUnique({
        where: { hotelId_number: { hotelId, number: data.number } },
      });
      if (dup) return fail("That room number already exists", 409);
    }
    const room = await prisma.room.update({ where: { id: params.id }, data });
    return ok(room);
  });
}

// DELETE — remove a room (blocked if it has orders).
export async function DELETE(_req: Request, { params }: Params) {
  return handle(async () => {
    const hotelId = await managerHotelId();
    if (!hotelId) return unauthorized();
    const existing = await prisma.room.findUnique({ where: { id: params.id } });
    if (!existing || existing.hotelId !== hotelId) return notFound("Room");

    const orderCount = await prisma.order.count({
      where: { roomId: params.id },
    });
    if (orderCount > 0) {
      return fail(
        "This room has orders and cannot be deleted. Hide it instead.",
        409
      );
    }
    await prisma.room.delete({ where: { id: params.id } });
    return ok({ ok: true });
  });
}
