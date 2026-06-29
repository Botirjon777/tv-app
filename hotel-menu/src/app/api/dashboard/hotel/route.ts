import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { handle, ok, unauthorized } from "@/lib/http";
import { hotelSettingsInput } from "@/lib/validation";

// GET /api/dashboard/hotel — the signed-in manager's hotel + setup status.
export async function GET() {
  return handle(async () => {
    const session = await getServerSession();
    if (!session || session.role !== "manager") return unauthorized();

    const hotel = await prisma.hotel.findUnique({
      where: { id: session.hotelId },
      select: {
        id: true,
        name: true,
        slug: true,
        connectCode: true,
        serviceFeeType: true,
        serviceFeeValue: true,
        preorderEnabled: true,
        instagramUrl: true,
        telegramUrl: true,
        telegramChatId: true,
        logoUrl: true,
        wifiName: true,
        wifiPassword: true,
      },
    });
    if (!hotel) return unauthorized();

    const [serviceCount, productCount] = await Promise.all([
      prisma.hotelService.count({ where: { hotelId: hotel.id } }),
      // Menu is still shared platform-wide; becomes per-hotel in a later step.
      prisma.product.count(),
    ]);

    return ok({
      id: hotel.id,
      name: hotel.name,
      slug: hotel.slug,
      connectCode: hotel.connectCode,
      serviceFeeType: hotel.serviceFeeType,
      serviceFeeValue: hotel.serviceFeeValue,
      preorderEnabled: hotel.preorderEnabled,
      instagramUrl: hotel.instagramUrl,
      telegramUrl: hotel.telegramUrl,
      telegramLinked: Boolean(hotel.telegramChatId),
      logoUrl: hotel.logoUrl,
      wifiName: hotel.wifiName,
      wifiPassword: hotel.wifiPassword,
      serviceCount,
      productCount,
    });
  });
}

// PATCH /api/dashboard/hotel — manager updates their own hotel's settings
// (service fee, preorder, social links, Wi-Fi, logo).
export async function PATCH(req: Request) {
  return handle(async () => {
    const session = await getServerSession();
    if (!session || session.role !== "manager") return unauthorized();
    const body = await req.json().catch(() => ({}));
    const data = hotelSettingsInput.parse(body);
    await prisma.hotel.update({ where: { id: session.hotelId }, data });
    return ok({ ok: true });
  });
}
