import { prisma } from "@/lib/prisma";
import { categoryInput } from "@/lib/validation";
import { handle, notFound, ok, unauthorized } from "@/lib/http";
import { managerHotelId } from "@/lib/session";
import { translateFields } from "@/lib/translate";
import { serializeCategory } from "@/lib/serialize-menu";

type Params = { params: { id: string } };

// PATCH — rename/reorder one of the manager's categories (re-translates the name).
export async function PATCH(req: Request, { params }: Params) {
  return handle(async () => {
    const hotelId = await managerHotelId();
    if (!hotelId) return unauthorized();
    const existing = await prisma.category.findUnique({
      where: { id: params.id },
    });
    if (!existing || existing.hotelId !== hotelId) return notFound("Category");

    const data = categoryInput.partial().parse(await req.json().catch(() => ({})));
    const update: Record<string, unknown> = {};
    if (data.sortOrder !== undefined) update.sortOrder = data.sortOrder;
    if (data.name !== undefined) {
      const sourceLang = data.sourceLang ?? (existing.sourceLang as "en");
      const translated = await translateFields({ name: data.name }, sourceLang);
      update.name = data.name;
      update.sourceLang = sourceLang;
      update.nameI18n = JSON.stringify(translated.name);
    }

    const category = await prisma.category.update({
      where: { id: params.id },
      data: update,
    });
    return ok(serializeCategory(category));
  });
}

// DELETE — remove a category (cascades to its products).
export async function DELETE(_req: Request, { params }: Params) {
  return handle(async () => {
    const hotelId = await managerHotelId();
    if (!hotelId) return unauthorized();
    const existing = await prisma.category.findUnique({
      where: { id: params.id },
    });
    if (!existing || existing.hotelId !== hotelId) return notFound("Category");
    await prisma.category.delete({ where: { id: params.id } });
    return ok({ ok: true });
  });
}
