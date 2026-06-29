import { prisma } from "@/lib/prisma";
import { productUpdateInput } from "@/lib/validation";
import { fail, handle, notFound, ok, unauthorized } from "@/lib/http";
import { managerHotelId } from "@/lib/session";
import { translateFields } from "@/lib/translate";
import { serializeProduct } from "@/lib/serialize-menu";

type Params = { params: { id: string } };

// PATCH — update one of the manager's products (re-translates name/description on change).
export async function PATCH(req: Request, { params }: Params) {
  return handle(async () => {
    const hotelId = await managerHotelId();
    if (!hotelId) return unauthorized();
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
    });
    if (!existing || existing.hotelId !== hotelId) return notFound("Product");

    const data = productUpdateInput.parse(await req.json().catch(() => ({})));
    const update: Record<string, unknown> = {};
    if (data.price !== undefined) update.price = data.price;
    if (data.imageUrl !== undefined) update.imageUrl = data.imageUrl;
    if (data.available !== undefined) update.available = data.available;
    if (data.sortOrder !== undefined) update.sortOrder = data.sortOrder;
    if (data.categoryId !== undefined) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category || category.hotelId !== hotelId) {
        return fail("Category not found", 404);
      }
      update.categoryId = data.categoryId;
    }

    const nameChanged = data.name !== undefined && data.name !== existing.name;
    const descChanged =
      data.description !== undefined && data.description !== existing.description;
    const langChanged =
      data.sourceLang !== undefined && data.sourceLang !== existing.sourceLang;
    if (nameChanged || descChanged || langChanged) {
      const sourceLang = (data.sourceLang ?? existing.sourceLang) as "en";
      const name = data.name ?? existing.name;
      const description = data.description ?? existing.description;
      const translated = await translateFields({ name, description }, sourceLang);
      update.name = name;
      update.description = description;
      update.sourceLang = sourceLang;
      update.nameI18n = JSON.stringify(translated.name);
      update.descI18n = JSON.stringify(translated.description);
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: update,
      include: { category: { select: { name: true } } },
    });
    return ok(serializeProduct(product));
  });
}

// DELETE — remove a product.
export async function DELETE(_req: Request, { params }: Params) {
  return handle(async () => {
    const hotelId = await managerHotelId();
    if (!hotelId) return unauthorized();
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
    });
    if (!existing || existing.hotelId !== hotelId) return notFound("Product");
    await prisma.product.delete({ where: { id: params.id } });
    return ok({ ok: true });
  });
}
