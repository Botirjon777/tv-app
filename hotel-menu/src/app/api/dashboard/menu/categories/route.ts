import { prisma } from "@/lib/prisma";
import { categoryInput } from "@/lib/validation";
import { handle, ok, unauthorized } from "@/lib/http";
import { managerHotelId } from "@/lib/session";
import { translateFields } from "@/lib/translate";
import { serializeCategory } from "@/lib/serialize-menu";

// GET /api/dashboard/menu/categories — the manager's hotel categories.
export async function GET() {
  return handle(async () => {
    const hotelId = await managerHotelId();
    if (!hotelId) return unauthorized();
    const categories = await prisma.category.findMany({
      where: { hotelId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return ok(categories.map(serializeCategory));
  });
}

// POST — create a category (auto-translates the name).
export async function POST(req: Request) {
  return handle(async () => {
    const hotelId = await managerHotelId();
    if (!hotelId) return unauthorized();
    const data = categoryInput.parse(await req.json().catch(() => ({})));
    const count = await prisma.category.count({ where: { hotelId } });
    const translated = await translateFields({ name: data.name }, data.sourceLang);

    const category = await prisma.category.create({
      data: {
        hotelId,
        name: data.name,
        sourceLang: data.sourceLang,
        nameI18n: JSON.stringify(translated.name),
        sortOrder: data.sortOrder ?? count,
      },
    });
    return ok(serializeCategory(category), 201);
  });
}
