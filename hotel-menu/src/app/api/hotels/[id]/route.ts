import { prisma } from "@/lib/prisma";
import { hotelUpdateInput } from "@/lib/validation";
import { fail, handle, notFound, ok, unauthorized } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { RESERVED_SLUGS } from "@/lib/slug";

type Params = { params: { id: string } };

// PATCH /api/hotels/:id — admin. Rename / change slug / toggle active.
export async function PATCH(req: Request, { params }: Params) {
  return handle(async () => {
    if (!(await requireRole(["admin"]))) return unauthorized();
    const body = await req.json().catch(() => ({}));
    const data = hotelUpdateInput.parse(body);

    const existing = await prisma.hotel.findUnique({ where: { id: params.id } });
    if (!existing) return notFound("Hotel");

    if (data.slug && data.slug !== existing.slug) {
      if (RESERVED_SLUGS.has(data.slug)) {
        return fail("That slug is reserved, choose another", 409);
      }
      const dup = await prisma.hotel.findUnique({ where: { slug: data.slug } });
      if (dup) return fail("A hotel with that slug already exists", 409);
    }

    const hotel = await prisma.hotel.update({
      where: { id: params.id },
      data,
    });
    return ok(hotel);
  });
}

// DELETE /api/hotels/:id — admin. Blocked if any of its rooms have orders.
export async function DELETE(_req: Request, { params }: Params) {
  return handle(async () => {
    if (!(await requireRole(["admin"]))) return unauthorized();
    const existing = await prisma.hotel.findUnique({ where: { id: params.id } });
    if (!existing) return notFound("Hotel");

    const orderCount = await prisma.order.count({
      where: { room: { hotelId: params.id } },
    });
    if (orderCount > 0) {
      return fail(
        "This hotel has orders and cannot be deleted. Deactivate it instead.",
        409
      );
    }

    // No orders — safe to remove the hotel and its rooms (cascade).
    await prisma.hotel.delete({ where: { id: params.id } });
    return ok({ ok: true });
  });
}
