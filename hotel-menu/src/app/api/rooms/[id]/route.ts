import { prisma } from "@/lib/prisma";
import { roomUpdateInput } from "@/lib/validation";
import { fail, handle, notFound, ok, unauthorized } from "@/lib/http";
import { requireRole } from "@/lib/session";

type Params = { params: { id: string } };

// PATCH /api/rooms/:id — admin only
export async function PATCH(req: Request, { params }: Params) {
  return handle(async () => {
    if (!(await requireRole(["admin"]))) return unauthorized();
    const body = await req.json().catch(() => ({}));
    const data = roomUpdateInput.parse(body);
    const existing = await prisma.room.findUnique({ where: { id: params.id } });
    if (!existing) return notFound("Room");
    if (data.number && data.number !== existing.number) {
      const dup = await prisma.room.findUnique({
        where: {
          hotelId_number: {
            hotelId: existing.hotelId,
            number: data.number,
          },
        },
      });
      if (dup) {
        return fail("That room number already exists in this hotel", 409);
      }
    }
    const room = await prisma.room.update({ where: { id: params.id }, data });
    return ok(room);
  });
}

// DELETE /api/rooms/:id — admin only
export async function DELETE(_req: Request, { params }: Params) {
  return handle(async () => {
    if (!(await requireRole(["admin"]))) return unauthorized();
    const existing = await prisma.room.findUnique({ where: { id: params.id } });
    if (!existing) return notFound("Room");
    const orderCount = await prisma.order.count({
      where: { roomId: params.id },
    });
    if (orderCount > 0) {
      return fail(
        "This room has orders and cannot be deleted. Deactivate it instead.",
        409
      );
    }
    await prisma.room.delete({ where: { id: params.id } });
    return ok({ ok: true });
  });
}
