import { prisma } from "@/lib/prisma";
import { productInput } from "@/lib/validation";
import { fail, handle, ok, unauthorized } from "@/lib/http";
import { managerHotelId } from "@/lib/session";
import { translateFields } from "@/lib/translate";
import { serializeProduct } from "@/lib/serialize-menu";

// GET /api/dashboard/menu/products — the manager's hotel products.
export async function GET() {
  return handle(async () => {
    const hotelId = await managerHotelId();
    if (!hotelId) return unauthorized();
    const products = await prisma.product.findMany({
      where: { hotelId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { category: { select: { name: true } } },
    });
    return ok(products.map(serializeProduct));
  });
}

// POST — create a product under one of the manager's categories.
export async function POST(req: Request) {
  return handle(async () => {
    const hotelId = await managerHotelId();
    if (!hotelId) return unauthorized();
    const data = productInput.parse(await req.json().catch(() => ({})));

    // The category must belong to this hotel.
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!category || category.hotelId !== hotelId) {
      return fail("Category not found", 404);
    }

    const count = await prisma.product.count({
      where: { categoryId: data.categoryId },
    });
    const translated = await translateFields(
      { name: data.name, description: data.description ?? "" },
      data.sourceLang
    );

    const product = await prisma.product.create({
      data: {
        hotelId,
        categoryId: data.categoryId,
        name: data.name,
        description: data.description ?? "",
        sourceLang: data.sourceLang,
        nameI18n: JSON.stringify(translated.name),
        descI18n: JSON.stringify(translated.description),
        price: data.price,
        imageUrl: data.imageUrl ?? "",
        available: data.available ?? true,
        sortOrder: data.sortOrder ?? count,
      },
      include: { category: { select: { name: true } } },
    });
    return ok(serializeProduct(product), 201);
  });
}
