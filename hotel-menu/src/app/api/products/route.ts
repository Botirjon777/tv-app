import { prisma } from "@/lib/prisma";
import { productInput } from "@/lib/validation";
import { handle, ok, unauthorized } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { translateFields } from "@/lib/translate";
import { serializeProduct } from "@/lib/serialize-menu";

// GET /api/products — public. Optional ?categoryId= and ?availableOnly=1
export async function GET(req: Request) {
  return handle(async () => {
    const url = new URL(req.url);
    const categoryId = url.searchParams.get("categoryId") || undefined;
    const availableOnly = url.searchParams.get("availableOnly") === "1";
    const products = await prisma.product.findMany({
      where: {
        ...(categoryId ? { categoryId } : {}),
        ...(availableOnly ? { available: true } : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { category: { select: { name: true } } },
    });
    return ok(products.map(serializeProduct));
  });
}

// POST /api/products — admin only. Auto-translates name + description.
export async function POST(req: Request) {
  return handle(async () => {
    if (!(await requireRole(["admin"]))) return unauthorized();
    const body = await req.json().catch(() => ({}));
    const data = productInput.parse(body);
    const count = await prisma.product.count({
      where: { categoryId: data.categoryId },
    });

    const translated = await translateFields(
      { name: data.name, description: data.description ?? "" },
      data.sourceLang
    );

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description ?? "",
        sourceLang: data.sourceLang,
        nameI18n: JSON.stringify(translated.name),
        descI18n: JSON.stringify(translated.description),
        price: data.price,
        imageUrl: data.imageUrl ?? "",
        available: data.available ?? true,
        sortOrder: data.sortOrder ?? count,
        categoryId: data.categoryId,
      },
      include: { category: { select: { name: true } } },
    });
    return ok(serializeProduct(product), 201);
  });
}
