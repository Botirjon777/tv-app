import { prisma } from "@/lib/prisma";
import { orderStatusInput } from "@/lib/validation";
import { handle, notFound, ok, unauthorized } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { serializeOrder, orderInclude } from "@/lib/serialize";
import { publishOrderEvent } from "@/lib/events";

type Params = { params: { id: string } };

// GET /api/orders/:id — PUBLIC (guest tracks their own order by id)
export async function GET(_req: Request, { params }: Params) {
  return handle(async () => {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: orderInclude,
    });
    if (!order) return notFound("Order");
    return ok(serializeOrder(order));
  });
}

// PATCH /api/orders/:id — staff only. Update status.
export async function PATCH(req: Request, { params }: Params) {
  return handle(async () => {
    if (!(await requireRole(["pos", "admin"]))) return unauthorized();
    const body = await req.json().catch(() => ({}));
    const { status } = orderStatusInput.parse(body);

    const existing = await prisma.order.findUnique({
      where: { id: params.id },
    });
    if (!existing) return notFound("Order");

    const order = await prisma.order.update({
      where: { id: params.id },
      data: { status },
      include: orderInclude,
    });

    const dto = serializeOrder(order);
    publishOrderEvent({ type: "order.updated", order: dto });
    return ok(dto);
  });
}
