import { prisma } from "@/lib/prisma";
import { orderInput } from "@/lib/validation";
import { fail, handle, ok, unauthorized } from "@/lib/http";
import { getServerSession } from "@/lib/session";
import { serializeOrder, orderInclude } from "@/lib/serialize";
import { ACTIVE_STATUSES, isOrderStatus } from "@/lib/orders";
import { sendMessage, formatOrderMessage } from "@/lib/telegram";
import { computeServiceFee } from "@/lib/fees";

// GET /api/orders — staff only.
// Filters: ?status=PENDING&active=1&hotelId=...&hotelSlug=...&roomNumber=101&limit=50
export async function GET(req: Request) {
  return handle(async () => {
    const session = await getServerSession();
    if (!session) return unauthorized();
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const active = url.searchParams.get("active") === "1";
    const hotelId = url.searchParams.get("hotelId") || undefined;
    const hotelSlug = url.searchParams.get("hotelSlug") || undefined;
    const roomNumber = url.searchParams.get("roomNumber") || undefined;
    const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 200);

    // POS is locked to its own hotel; admin may filter by query params.
    const scopedHotelId = session.role === "pos" ? session.hotelId : hotelId;
    const roomFilter = {
      ...(scopedHotelId ? { hotelId: scopedHotelId } : {}),
      ...(session.role === "admin" && hotelSlug ? { hotel: { slug: hotelSlug } } : {}),
      ...(roomNumber ? { number: roomNumber } : {}),
    };

    const orders = await prisma.order.findMany({
      where: {
        ...(status && isOrderStatus(status) ? { status } : {}),
        ...(active ? { status: { in: ACTIVE_STATUSES } } : {}),
        ...(Object.keys(roomFilter).length ? { room: roomFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: orderInclude,
    });
    return ok(orders.map(serializeOrder));
  });
}

// POST /api/orders — PUBLIC. A guest places an order from their room.
export async function POST(req: Request) {
  return handle(async () => {
    const body = await req.json().catch(() => ({}));
    const data = orderInput.parse(body);

    // Resolve the room within its hotel (room numbers are per-hotel).
    const hotel = await prisma.hotel.findUnique({
      where: { slug: data.hotelSlug },
    });
    if (!hotel || !hotel.active) {
      return fail("This hotel is not available for ordering", 400);
    }
    const room = await prisma.room.findUnique({
      where: {
        hotelId_number: { hotelId: hotel.id, number: data.roomNumber },
      },
    });
    if (!room || !room.active) {
      return fail("This room is not available for ordering", 400);
    }

    // Load the referenced products and snapshot their price/name.
    const productIds = data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, available: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    // Reject the whole order if any line references a now-unavailable product.
    const missing = data.items.filter((i) => !byId.has(i.productId));
    if (missing.length > 0) {
      return fail(
        "Some items are no longer available. Please review your cart.",
        409
      );
    }

    const lineItems = data.items.map((item) => {
      const product = byId.get(item.productId)!;
      return {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      };
    });

    const subtotal = lineItems.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0
    );
    const serviceFee = computeServiceFee(
      subtotal,
      hotel.serviceFeeType,
      hotel.serviceFeeValue
    );

    const order = await prisma.order.create({
      data: {
        roomId: room.id,
        note: data.note ?? "",
        serviceFee,
        total: subtotal + serviceFee,
        status: "PENDING",
        items: { create: lineItems },
      },
      include: orderInclude,
    });

    const dto = serializeOrder(order);

    // Notify the hotel's linked Telegram staff group (best-effort).
    if (hotel.telegramChatId) {
      await sendMessage(hotel.telegramChatId, formatOrderMessage(dto));
    }

    return ok(dto, 201);
  });
}
