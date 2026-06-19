import { prisma } from "@/lib/prisma";
import { recommendationInput } from "@/lib/validation";
import { fail, handle, ok, unauthorized } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { serializeRecommendation } from "@/lib/serialize-menu";

const withProduct = {
  product: { include: { category: { select: { name: true } } } },
} as const;

// GET /api/recommendations — admin only. All recommendations, with product info.
// Optional ?day=N to filter a single weekday.
export async function GET(req: Request) {
  return handle(async () => {
    if (!(await requireRole(["admin"]))) return unauthorized();
    const day = new URL(req.url).searchParams.get("day");
    const dayOfWeek = day !== null ? Number(day) : undefined;
    const recs = await prisma.recommendation.findMany({
      where:
        dayOfWeek !== undefined && !Number.isNaN(dayOfWeek) ? { dayOfWeek } : {},
      orderBy: [{ dayOfWeek: "asc" }, { sortOrder: "asc" }],
      include: withProduct,
    });
    return ok(recs.map(serializeRecommendation));
  });
}

// POST /api/recommendations — admin only. Feature a product on a weekday.
export async function POST(req: Request) {
  return handle(async () => {
    if (!(await requireRole(["admin"]))) return unauthorized();
    const body = await req.json().catch(() => ({}));
    const data = recommendationInput.parse(body);

    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });
    if (!product) return fail("Product not found", 404);

    const dup = await prisma.recommendation.findUnique({
      where: {
        dayOfWeek_productId: {
          dayOfWeek: data.dayOfWeek,
          productId: data.productId,
        },
      },
    });
    if (dup) return fail("That product is already recommended for this day", 409);

    const count = await prisma.recommendation.count({
      where: { dayOfWeek: data.dayOfWeek },
    });
    const rec = await prisma.recommendation.create({
      data: {
        dayOfWeek: data.dayOfWeek,
        productId: data.productId,
        sortOrder: data.sortOrder ?? count,
      },
      include: withProduct,
    });
    return ok(serializeRecommendation(rec), 201);
  });
}
