import { prisma } from "@/lib/prisma";
import { recommendationInput } from "@/lib/validation";
import { fail, handle, ok, unauthorized } from "@/lib/http";
import { managerHotelId } from "@/lib/session";
import { serializeRecommendation } from "@/lib/serialize-menu";

// GET /api/dashboard/menu/recommendations — the manager's featured products by weekday.
export async function GET() {
  return handle(async () => {
    const hotelId = await managerHotelId();
    if (!hotelId) return unauthorized();
    const recs = await prisma.recommendation.findMany({
      where: { hotelId },
      orderBy: [{ dayOfWeek: "asc" }, { sortOrder: "asc" }],
      include: { product: true },
    });
    return ok(recs.map(serializeRecommendation));
  });
}

// POST — feature one of the manager's products on a weekday.
export async function POST(req: Request) {
  return handle(async () => {
    const hotelId = await managerHotelId();
    if (!hotelId) return unauthorized();
    const data = recommendationInput.parse(await req.json().catch(() => ({})));

    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });
    if (!product || product.hotelId !== hotelId) {
      return fail("Product not found", 404);
    }

    const exists = await prisma.recommendation.findFirst({
      where: { hotelId, dayOfWeek: data.dayOfWeek, productId: data.productId },
    });
    if (exists) return fail("Already featured on that day", 409);

    const count = await prisma.recommendation.count({
      where: { hotelId, dayOfWeek: data.dayOfWeek },
    });
    const rec = await prisma.recommendation.create({
      data: {
        hotelId,
        dayOfWeek: data.dayOfWeek,
        productId: data.productId,
        sortOrder: data.sortOrder ?? count,
      },
      include: { product: true },
    });
    return ok(serializeRecommendation(rec), 201);
  });
}
