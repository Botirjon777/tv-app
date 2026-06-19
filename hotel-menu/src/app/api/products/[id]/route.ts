import { prisma } from "@/lib/prisma";
import { productUpdateInput } from "@/lib/validation";
import { handle, notFound, ok, unauthorized } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { translateFields } from "@/lib/translate";
import { serializeProduct } from "@/lib/serialize-menu";

type Params = { params: { id: string } };

// PATCH /api/products/:id — admin only. Re-translates if name/description change.
export async function PATCH(req: Request, { params }: Params) {
  return handle(async () => {
    if (!(await requireRole(["admin"]))) return unauthorized();
    const body = await req.json().catch(() => ({}));
    const data = productUpdateInput.parse(body);
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
    });
    if (!existing) return notFound("Product");

    const update: Record<string, unknown> = {};
    if (data.price !== undefined) update.price = data.price;
    if (data.imageUrl !== undefined) update.imageUrl = data.imageUrl;
    if (data.available !== undefined) update.available = data.available;
    if (data.sortOrder !== undefined) update.sortOrder = data.sortOrder;
    if (data.categoryId !== undefined) update.categoryId = data.categoryId;

    // Re-translate when the source text or language changes.
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

// DELETE /api/products/:id — admin only
export async function DELETE(_req: Request, { params }: Params) {
  return handle(async () => {
    if (!(await requireRole(["admin"]))) return unauthorized();
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
    });
    if (!existing) return notFound("Product");
    await prisma.product.delete({ where: { id: params.id } });
    return ok({ ok: true });
  });
}
