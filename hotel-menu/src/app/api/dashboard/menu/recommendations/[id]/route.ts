import { prisma } from "@/lib/prisma";
import { handle, notFound, ok, unauthorized } from "@/lib/http";
import { managerHotelId } from "@/lib/session";

type Params = { params: { id: string } };

// DELETE /api/dashboard/menu/recommendations/:id — unfeature a product.
export async function DELETE(_req: Request, { params }: Params) {
  return handle(async () => {
    const hotelId = await managerHotelId();
    if (!hotelId) return unauthorized();
    const existing = await prisma.recommendation.findUnique({
      where: { id: params.id },
    });
    if (!existing || existing.hotelId !== hotelId) {
      return notFound("Recommendation");
    }
    await prisma.recommendation.delete({ where: { id: params.id } });
    return ok({ ok: true });
  });
}
