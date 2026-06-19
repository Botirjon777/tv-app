import { prisma } from "@/lib/prisma";
import { categoryInput } from "@/lib/validation";
import { handle, notFound, ok, unauthorized } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { translateFields } from "@/lib/translate";
import { serializeCategory } from "@/lib/serialize-menu";

type Params = { params: { id: string } };

// PATCH /api/categories/:id — admin only. Re-translates if the name changed.
export async function PATCH(req: Request, { params }: Params) {
  return handle(async () => {
    if (!(await requireRole(["admin"]))) return unauthorized();
    const body = await req.json().catch(() => ({}));
    const data = categoryInput.partial().parse(body);
    const existing = await prisma.category.findUnique({
      where: { id: params.id },
    });
    if (!existing) return notFound("Category");

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

// DELETE /api/categories/:id — admin only (cascades to products)
export async function DELETE(_req: Request, { params }: Params) {
  return handle(async () => {
    if (!(await requireRole(["admin"]))) return unauthorized();
    const existing = await prisma.category.findUnique({
      where: { id: params.id },
    });
    if (!existing) return notFound("Category");
    await prisma.category.delete({ where: { id: params.id } });
    return ok({ ok: true });
  });
}
