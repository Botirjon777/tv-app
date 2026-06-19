import { prisma } from "@/lib/prisma";
import { categoryInput } from "@/lib/validation";
import { handle, ok, unauthorized } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { translateFields } from "@/lib/translate";
import { serializeCategory } from "@/lib/serialize-menu";

// GET /api/categories — public (used by client menu & admin)
export async function GET() {
  return handle(async () => {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return ok(categories.map(serializeCategory));
  });
}

// POST /api/categories — admin only. Auto-translates the name.
export async function POST(req: Request) {
  return handle(async () => {
    if (!(await requireRole(["admin"]))) return unauthorized();
    const body = await req.json().catch(() => ({}));
    const data = categoryInput.parse(body);
    const count = await prisma.category.count();

    const translated = await translateFields(
      { name: data.name },
      data.sourceLang
    );

    const category = await prisma.category.create({
      data: {
        name: data.name,
        sourceLang: data.sourceLang,
        nameI18n: JSON.stringify(translated.name),
        sortOrder: data.sortOrder ?? count,
      },
    });
    return ok(serializeCategory(category), 201);
  });
}
