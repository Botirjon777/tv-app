import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { handle, notFound, ok, unauthorized } from "@/lib/http";
import { serviceUpdateInput } from "@/lib/validation";
import { translateFields } from "@/lib/translate";
import { serializeService } from "@/lib/serialize-menu";

type Params = { params: { id: string } };

async function managerHotelId(): Promise<string | null> {
  const session = await getServerSession();
  return session?.role === "manager" ? session.hotelId : null;
}

// PATCH /api/dashboard/services/:id — update one of the manager's services.
export async function PATCH(req: Request, { params }: Params) {
  return handle(async () => {
    const hotelId = await managerHotelId();
    if (!hotelId) return unauthorized();

    const existing = await prisma.hotelService.findUnique({
      where: { id: params.id },
    });
    if (!existing || existing.hotelId !== hotelId) return notFound("Service");

    const data = serviceUpdateInput.parse(await req.json().catch(() => ({})));

    // Re-translate when the text or its source language changes.
    const retranslate =
      data.name !== undefined ||
      data.description !== undefined ||
      data.sourceLang !== undefined;
    let i18n = {};
    if (retranslate) {
      const translated = await translateFields(
        {
          name: data.name ?? existing.name,
          description: data.description ?? existing.description,
        },
        data.sourceLang ?? (existing.sourceLang as "en" | "ru" | "uz")
      );
      i18n = {
        nameI18n: JSON.stringify(translated.name),
        descI18n: JSON.stringify(translated.description),
      };
    }

    const service = await prisma.hotelService.update({
      where: { id: params.id },
      data: { ...data, ...i18n },
    });
    return ok(serializeService(service));
  });
}

// DELETE /api/dashboard/services/:id
export async function DELETE(_req: Request, { params }: Params) {
  return handle(async () => {
    const hotelId = await managerHotelId();
    if (!hotelId) return unauthorized();
    const existing = await prisma.hotelService.findUnique({
      where: { id: params.id },
    });
    if (!existing || existing.hotelId !== hotelId) return notFound("Service");
    await prisma.hotelService.delete({ where: { id: params.id } });
    return ok({ ok: true });
  });
}
