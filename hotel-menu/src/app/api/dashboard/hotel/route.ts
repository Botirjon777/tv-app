import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { handle, ok, unauthorized } from "@/lib/http";

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
      serviceCount,
      productCount,
    });
  });
}
