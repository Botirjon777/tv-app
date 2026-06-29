import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { handle, ok, unauthorized } from "@/lib/http";

// GET /api/auth/me — the current session and (for POS) its hotel.
export async function GET() {
  return handle(async () => {
    const session = await getServerSession();
    if (!session) return unauthorized();

    if (session.role === "pos" || session.role === "manager") {
      const hotel = await prisma.hotel.findUnique({
        where: { id: session.hotelId },
        select: { id: true, name: true, connectCode: true },
      });
      return ok({ role: session.role, hotel });
    }

    return ok({ role: "admin" as const, hotel: null });
  });
}
