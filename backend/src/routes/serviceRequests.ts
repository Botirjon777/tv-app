/* Guest service requests — alarm / reception / taxi.
 *
 * Raised by the guest from the in-room web page (hotel-menu) or the TV launcher
 * (my-hotel), surfaced live in the admin dashboard, and forwarded to Telegram.
 *
 *   POST /api/v1/menu/requests            (public)  guest raises a request
 *   GET  /api/v1/admin/requests           (JWT)     staff list (filter by status)
 *   PATCH/api/v1/admin/requests/:id       (JWT)     staff update status
 *
 * Request types: ALARM | SERVICE | TAXI | RECEPTION | PROBLEM (free string, extensible).
 * Statuses: PENDING | ACKNOWLEDGED | RESOLVED | CANCELLED.
 */
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { sendTelegram, formatRequestMessage } from '../services/telegramService';

const REQUEST_TYPES = ['ALARM', 'SERVICE', 'TAXI', 'RECEPTION', 'PROBLEM'] as const;
const REQUEST_STATUSES = ['PENDING', 'ACKNOWLEDGED', 'RESOLVED', 'CANCELLED'] as const;

function ok<T>(reply: FastifyReply, data: T, code = 200, message = 'OK') {
  return reply.status(code === 201 ? 201 : 200).send({ data, code, message });
}
function err(reply: FastifyReply, message: string, code = 400) {
  return reply.status(code).send({ data: null, code, message });
}

const createBody = z.object({
  hotelSlug: z.string().min(1),
  roomNumber: z.string().min(1).max(20),
  type: z.enum(REQUEST_TYPES),
  note: z.string().max(500).optional(),
  guestName: z.string().max(120).optional(),
  source: z.enum(['web', 'tv']).optional().default('web'),
  payload: z.record(z.unknown()).optional(),
});

const patchBody = z.object({
  status: z.enum(REQUEST_STATUSES),
});

export async function serviceRequestRoutes(server: FastifyInstance) {
  const prisma = server.prisma;

  /* ── POST /menu/requests (public) ─────────────────────────────────── */
  server.post('/menu/requests', async (req, reply) => {
    const parsed = createBody.safeParse(req.body);
    if (!parsed.success) return err(reply, 'Invalid request payload', 422);
    const data = parsed.data;

    const hotel = await prisma.menuHotel.findUnique({ where: { slug: data.hotelSlug } });
    if (!hotel || !hotel.active) return err(reply, 'Hotel not available', 400);

    const created = await prisma.serviceRequest.create({
      data: {
        hotelId: hotel.id,
        roomNumber: data.roomNumber,
        type: data.type,
        note: data.note ?? '',
        guestName: data.guestName ?? '',
        source: data.source,
        payload: JSON.stringify(data.payload ?? {}),
        status: 'PENDING',
      },
    });

    // Fire-and-forget Telegram notification (never blocks the response).
    void sendTelegram(
      formatRequestMessage({
        type: created.type,
        hotelName: hotel.name,
        roomNumber: created.roomNumber,
        guestName: created.guestName,
        note: created.note,
        source: created.source,
      }),
      req.log,
    );

    return ok(
      reply,
      {
        id: created.id,
        type: created.type,
        status: created.status,
        roomNumber: created.roomNumber,
        hotelSlug: hotel.slug,
        createdAt: created.createdAt,
      },
      201,
      'Request received',
    );
  });

  /* ── GET /admin/requests (JWT) ────────────────────────────────────── */
  server.get<{ Querystring: { status?: string; hotelSlug?: string; limit?: string } }>(
    '/admin/requests',
    { preHandler: requireAdmin },
    async (req, reply) => {
      const { status, hotelSlug, limit } = req.query;
      const where: Record<string, unknown> = {};
      if (status && (REQUEST_STATUSES as readonly string[]).includes(status)) {
        where.status = status;
      }
      if (hotelSlug) where.hotel = { slug: hotelSlug };

      const requests = await prisma.serviceRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(Number(limit) || 100, 500),
        include: { hotel: { select: { name: true, slug: true } } },
      });

      return ok(
        reply,
        requests.map((r) => ({
          id: r.id,
          type: r.type,
          status: r.status,
          roomNumber: r.roomNumber,
          guestName: r.guestName,
          note: r.note,
          source: r.source,
          hotelName: r.hotel.name,
          hotelSlug: r.hotel.slug,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
      );
    },
  );

  /* ── PATCH /admin/requests/:id (JWT) ──────────────────────────────── */
  server.patch<{ Params: { id: string } }>(
    '/admin/requests/:id',
    { preHandler: requireAdmin },
    async (req, reply) => {
      const parsed = patchBody.safeParse(req.body);
      if (!parsed.success) return err(reply, 'Invalid status', 422);

      const existing = await prisma.serviceRequest.findUnique({ where: { id: req.params.id } });
      if (!existing) return err(reply, 'Request not found', 404);

      const updated = await prisma.serviceRequest.update({
        where: { id: req.params.id },
        data: { status: parsed.data.status },
        include: { hotel: { select: { name: true, slug: true } } },
      });

      return ok(reply, {
        id: updated.id,
        type: updated.type,
        status: updated.status,
        roomNumber: updated.roomNumber,
        guestName: updated.guestName,
        note: updated.note,
        source: updated.source,
        hotelName: updated.hotel.name,
        hotelSlug: updated.hotel.slug,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      });
    },
  );
}

async function requireAdmin(req: FastifyRequest): Promise<void> {
  await req.jwtVerify();
}
