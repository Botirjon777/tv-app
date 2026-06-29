import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { handle, ok, unauthorized } from "@/lib/http";
import { resolveHotelAsset } from "@/lib/hotel-assets";

// GET /api/auth/me — the current session and (for POS) its hotel.
export async function GET() {
  return handle(async () => {
    const session = await getServerSession();
    if (!session) return unauthorized();

    if (session.role === "pos" || session.role === "manager") {
      const hotel = await prisma.hotel.findUnique({
        where: { id: session.hotelId },
        select: { id: true, name: true, slug: true, connectCode: true, logoUrl: true },
      });
      // Effective logo: a public/<slug>/logo.* file wins over the DB logoUrl.
      const logoUrl = hotel
        ? resolveHotelAsset(hotel.slug, "logo") || hotel.logoUrl
        : "";
      return ok({
        role: session.role,
        hotel: hotel ? { ...hotel, logoUrl } : null,
      });
    }

    return ok({ role: "admin" as const, hotel: null });
  });
}
