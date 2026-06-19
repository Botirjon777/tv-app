import { prisma } from "@/lib/prisma";
import { handle, notFound, ok, unauthorized } from "@/lib/http";
import { requireRole } from "@/lib/session";

type Params = { params: { id: string } };

// DELETE /api/recommendations/:id — admin only.
export async function DELETE(_req: Request, { params }: Params) {
  return handle(async () => {
    if (!(await requireRole(["admin"]))) return unauthorized();
    const existing = await prisma.recommendation.findUnique({
      where: { id: params.id },
    });
    if (!existing) return notFound("Recommendation");
    await prisma.recommendation.delete({ where: { id: params.id } });
    return ok({ ok: true });
  });
}
