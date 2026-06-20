/* Hotel-menu public REST API for the my-hotel Android TV app.
 *
 * Unlike the generic Prisma bridge in menuData.ts (used by the hotel-menu
 * Next.js app), these are plain REST endpoints shaped for a Retrofit client.
 * Every response uses the app's envelope: { data, code, message }.
 *
 *   GET  /api/v1/menu/hotels                      -> list bookable hotels
 *   GET  /api/v1/menu/categories                  -> menu categories
 *   GET  /api/v1/menu/products?categoryId&availableOnly
 *                                                 -> menu products
 *   POST /api/v1/menu/orders                      -> place an order
 *
 * The TV stores a hotel + room number during onboarding and sends them when
 * ordering. Room numbers are free text on the device, so the order endpoint
 * resolves (or creates) the room under the chosen hotel.
 */
import type { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';

const ORDER_STATUSES = ['PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];

function ok<T>(reply: FastifyReply, data: T, code = 200, message = 'OK') {
  return reply.status(code === 201 ? 201 : 200).send({ data, code, message });
}
function err(reply: FastifyReply, message: string, code = 400) {
  return reply.status(code).send({ data: null, code, message });
}

// Parse the i18n JSON-string columns into an object the app can consume.
function parseI18n(raw: string): Record<string, string> {
  try {
    const v = JSON.parse(raw || '{}');
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}

export async function menuApiRoutes(server: FastifyInstance) {
  const prisma = server.prisma;

  /* ── GET /menu/hotels ─────────────────────────────────────────────── */
  server.get('/menu/hotels', async (_req, reply) => {
    const hotels = await prisma.menuHotel.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      include: { _count: { select: { rooms: true } } },
    });
    return ok(
      reply,
      hotels.map((h) => ({
        id: h.id,
        name: h.name,
        slug: h.slug,
        floors: h.floors,
        roomsPerFloor: h.roomsPerFloor,
        roomCount: h._count.rooms,
      }))
    );
  });

  /* ── GET /menu/categories ─────────────────────────────────────────── */
  server.get('/menu/categories', async (_req, reply) => {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return ok(
      reply,
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        nameI18n: parseI18n(c.nameI18n),
        sortOrder: c.sortOrder,
      }))
    );
  });

  /* ── GET /menu/products?categoryId=&availableOnly=1 ───────────────── */
  server.get('/menu/products', async (req, reply) => {
    const q = req.query as { categoryId?: string; availableOnly?: string };
    const products = await prisma.product.findMany({
      where: {
        ...(q.categoryId ? { categoryId: q.categoryId } : {}),
        ...(q.availableOnly === '1' ? { available: true } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { category: { select: { name: true } } },
    });
    return ok(
      reply,
      products.map((p) => ({
        id: p.id,
        name: p.name,
        nameI18n: parseI18n(p.nameI18n),
        description: p.description,
        descI18n: parseI18n(p.descI18n),
        price: p.price,
        imageUrl: p.imageUrl,
        available: p.available,
        sortOrder: p.sortOrder,
        categoryId: p.categoryId,
        categoryName: p.category?.name ?? '',
      }))
    );
  });

  /* ── GET /menu/guest?hotelSlug=&roomNumber= ───────────────────────────
     Returns the currently checked-in guest for a room (checkIn <= now <=
     checkOut), or an empty name if none. The TV uses this for the welcome. */
  server.get('/menu/guest', async (req, reply) => {
    const q = req.query as { hotelSlug?: string; roomNumber?: string };
    if (!q.hotelSlug || !q.roomNumber) {
      return err(reply, 'hotelSlug and roomNumber are required', 422);
    }
    const hotel = await prisma.menuHotel.findUnique({ where: { slug: q.hotelSlug } });
    if (!hotel) return ok(reply, { fullName: '', hasGuest: false });

    const now = new Date();
    const guest = await prisma.menuGuest.findFirst({
      where: {
        hotelId: hotel.id,
        roomNumber: q.roomNumber,
        checkIn: { lte: now },
        checkOut: { gte: now },
      },
      orderBy: { checkIn: 'desc' },
    });
    return ok(reply, {
      fullName: guest?.fullName ?? '',
      hasGuest: !!guest,
      preferredLanguage: guest?.preferredLanguage ?? '',
      checkIn: guest?.checkIn?.toISOString() ?? null,
      checkOut: guest?.checkOut?.toISOString() ?? null,
    });
  });

  /* ── POST /menu/guest/language ────────────────────────────────────────
     Save the guest's preferred TV language so it can be skipped next time. */
  const langBody = z.object({
    hotelSlug: z.string().min(1),
    roomNumber: z.string().min(1),
    language: z.string().min(1),
  });
  server.post('/menu/guest/language', async (req, reply) => {
    const parsed = langBody.safeParse(req.body);
    if (!parsed.success) return err(reply, 'Invalid language payload', 422);
    const { hotelSlug, roomNumber, language } = parsed.data;
    const hotel = await prisma.menuHotel.findUnique({ where: { slug: hotelSlug } });
    if (!hotel) return err(reply, 'Hotel not found', 404);

    const now = new Date();
    const guest = await prisma.menuGuest.findFirst({
      where: { hotelId: hotel.id, roomNumber, checkIn: { lte: now }, checkOut: { gte: now } },
      orderBy: { checkIn: 'desc' },
    });
    if (!guest) return err(reply, 'No checked-in guest for this room', 404);

    await prisma.menuGuest.update({
      where: { id: guest.id },
      data: { preferredLanguage: language },
    });
    return ok(reply, { fullName: guest.fullName, preferredLanguage: language });
  });

  /* ── POST /menu/guest ─────────────────────────────────────────────────
     Check a guest into a room for N days (defaults to 1). */
  const guestBody = z.object({
    hotelSlug: z.string().min(1),
    roomNumber: z.string().min(1),
    fullName: z.string().min(1),
    days: z.number().int().positive().default(1),
  });
  server.post('/menu/guest', async (req, reply) => {
    const parsed = guestBody.safeParse(req.body);
    if (!parsed.success) return err(reply, 'Invalid guest payload', 422);
    const data = parsed.data;
    const hotel = await prisma.menuHotel.findUnique({ where: { slug: data.hotelSlug } });
    if (!hotel) return err(reply, 'Hotel not found', 404);

    const checkIn = new Date();
    const checkOut = new Date(checkIn.getTime() + data.days * 24 * 60 * 60 * 1000);
    const guest = await prisma.menuGuest.create({
      data: {
        hotelId: hotel.id,
        roomNumber: data.roomNumber,
        fullName: data.fullName,
        checkIn,
        checkOut,
      },
    });
    return ok(
      reply,
      {
        id: guest.id,
        fullName: guest.fullName,
        roomNumber: guest.roomNumber,
        checkIn: guest.checkIn.toISOString(),
        checkOut: guest.checkOut.toISOString(),
      },
      201,
      'Guest checked in'
    );
  });

  /* ── GET /menu/orders?hotelSlug=&roomNumber=&active=1 ──────────────────
     Orders for a room: active ones (to resume tracking) or full history. */
  server.get('/menu/orders', async (req, reply) => {
    const q = req.query as {
      hotelSlug?: string; roomNumber?: string; active?: string; limit?: string;
    };
    if (!q.hotelSlug || !q.roomNumber) {
      return err(reply, 'hotelSlug and roomNumber are required', 422);
    }
    const hotel = await prisma.menuHotel.findUnique({ where: { slug: q.hotelSlug } });
    if (!hotel) return ok(reply, []);

    const orders = await prisma.order.findMany({
      where: {
        room: { hotelId: hotel.id, number: q.roomNumber },
        ...(q.active === '1' ? { status: { in: ['PENDING', 'PREPARING', 'READY'] } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(q.limit) || 50, 100),
      include: { items: true },
    });
    return ok(
      reply,
      orders.map((o) => ({
        id: o.id,
        status: o.status,
        total: o.total,
        roomNumber: q.roomNumber,
        createdAt: o.createdAt.toISOString(),
        items: o.items.map((it) => ({ name: it.name, price: it.price, quantity: it.quantity })),
      }))
    );
  });

  /* ── PUT /menu/orders/:id ──────────────────────────────────────────────
     Edit an order's items — only while it is still PENDING (not yet in the
     kitchen). Replaces the line items and re-snapshots prices. */
  const editBody = z.object({
    items: z
      .array(z.object({ productId: z.string().min(1), quantity: z.number().int().positive() }))
      .min(1),
  });
  server.put('/menu/orders/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = editBody.safeParse(req.body);
    if (!parsed.success) return err(reply, 'Invalid order payload', 422);

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return err(reply, 'Order not found', 404);
    if (order.status !== 'PENDING') {
      return err(reply, 'This order is already being prepared and cannot be edited', 409);
    }

    const productIds = parsed.data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, available: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    if (parsed.data.items.some((i) => !byId.has(i.productId))) {
      return err(reply, 'Some items are no longer available', 409);
    }
    const lineItems = parsed.data.items.map((item) => {
      const product = byId.get(item.productId)!;
      return { productId: product.id, name: product.name, price: product.price, quantity: item.quantity };
    });
    const total = lineItems.reduce((sum, it) => sum + it.price * it.quantity, 0);

    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    const updated = await prisma.order.update({
      where: { id },
      data: { total, items: { create: lineItems } },
      include: { items: true, room: true },
    });
    return ok(reply, {
      id: updated.id,
      status: updated.status,
      total: updated.total,
      roomNumber: updated.room?.number ?? '',
      createdAt: updated.createdAt.toISOString(),
      items: updated.items.map((it) => ({ name: it.name, price: it.price, quantity: it.quantity })),
    });
  });

  /* ── GET /menu/orders/:id ─────────────────────────────────────────────
     One order's current status + items, for the TV order-tracking screen. */
  server.get('/menu/orders/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, room: true },
    });
    if (!order) return err(reply, 'Order not found', 404);
    return ok(reply, {
      id: order.id,
      status: order.status,
      total: order.total,
      roomNumber: order.room?.number ?? '',
      items: order.items.map((it) => ({
        productId: it.productId,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
      })),
      createdAt: order.createdAt.toISOString(),
    });
  });

  /* ── POST /menu/orders ────────────────────────────────────────────── */
  const orderBody = z.object({
    hotelSlug: z.string().min(1),
    roomNumber: z.string().min(1),
    note: z.string().optional(),
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          quantity: z.number().int().positive(),
        })
      )
      .min(1),
  });

  server.post('/menu/orders', async (req, reply) => {
    const parsed = orderBody.safeParse(req.body);
    if (!parsed.success) {
      return err(reply, 'Invalid order payload', 422);
    }
    const data = parsed.data;

    const hotel = await prisma.menuHotel.findUnique({
      where: { slug: data.hotelSlug },
    });
    if (!hotel || !hotel.active) {
      return err(reply, 'This hotel is not available for ordering', 400);
    }

    // Room numbers are entered freely on the TV — resolve or create the room.
    const room = await prisma.menuRoom.upsert({
      where: {
        hotelId_number: { hotelId: hotel.id, number: data.roomNumber },
      },
      update: {},
      create: {
        hotelId: hotel.id,
        number: data.roomNumber,
        name: `Room ${data.roomNumber}`,
      },
    });

    // Snapshot product name + price at order time.
    const productIds = data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, available: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    const missing = data.items.filter((i) => !byId.has(i.productId));
    if (missing.length > 0) {
      return err(reply, 'Some items are no longer available', 409);
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
    const total = lineItems.reduce((sum, it) => sum + it.price * it.quantity, 0);

    const order = await prisma.order.create({
      data: {
        roomId: room.id,
        note: data.note ?? '',
        total,
        status: 'PENDING',
        items: { create: lineItems },
      },
      include: { items: true },
    });

    return ok(
      reply,
      {
        id: order.id,
        status: order.status,
        total: order.total,
        roomNumber: data.roomNumber,
        hotelSlug: hotel.slug,
        items: order.items.map((it) => ({
          id: it.id,
          productId: it.productId,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
        })),
        createdAt: order.createdAt.toISOString(),
      },
      201,
      'Order placed'
    );
  });
}

export const _statuses = ORDER_STATUSES;
