/* Exely PMS webhook handler — POST /webhooks/exely */
import { createHmac, timingSafeEqual } from 'crypto';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { pushToRoom } from '../services/pushService';

interface ExelyGuest {
  first_name:  string;
  last_name:   string;
  nationality: string;
  language:    string;
  email?:      string;
}

interface ExelyReservation {
  id:             string;
  room_number:    string;
  arrival_date:   string;
  departure_date: string;
  guest:          ExelyGuest;
}

interface ExelyPayload {
  event:       string;
  hotel_id:    string;
  timestamp:   string;
  reservation: ExelyReservation;
}

function verifySignature(secret: string, body: string, header: string): boolean {
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(header));
  } catch {
    return false;
  }
}

export async function webhookRoutes(server: FastifyInstance) {
  server.post(
    '/webhooks/exely',
    async (req: FastifyRequest, reply) => {
      const secret = server.env.EXELY_WEBHOOK_SECRET;
      if (!secret) {
        // Only reachable in non-production (env validation requires it in prod).
        server.log.warn('EXELY_WEBHOOK_SECRET not set — skipping signature check (dev only)');
      } else {
        const sig  = (req.headers['x-exely-signature'] as string) ?? '';
        const body = (req as FastifyRequest & { rawBody?: Buffer }).rawBody?.toString('utf8') ?? JSON.stringify(req.body);
        if (!verifySignature(secret, body, sig)) {
          return reply.status(401).send({ error: 'Invalid signature' });
        }
      }

      const payload = req.body as ExelyPayload;
      const { event, reservation } = payload;

      if (!reservation) return reply.status(400).send({ error: 'Missing reservation' });

      const room = await server.prisma.room.findFirst({
        where: {
          roomNumber: reservation.room_number,
          hotel:      { id: { not: undefined } },
        },
        include: { hotel: true },
      });

      if (!room) {
        server.log.warn({ roomNumber: reservation.room_number }, 'Exely webhook: room not found');
        return { ok: true, note: 'room not mapped' };
      }

      switch (event) {
        case 'reservation.checked_in':
        case 'reservation.created': {
          await server.prisma.roomGuest.upsert({
            where:  { id: await findGuestId(server, room.id, reservation.id) ?? '' },
            create: {
              roomId:             room.id,
              exelyReservationId: reservation.id,
              guestFirstName:     reservation.guest.first_name,
              guestLastName:      reservation.guest.last_name,
              guestLanguage:      reservation.guest.language || 'en',
              checkIn:            new Date(reservation.arrival_date),
              checkOut:           new Date(reservation.departure_date),
            },
            update: {
              guestFirstName: reservation.guest.first_name,
              guestLastName:  reservation.guest.last_name,
              guestLanguage:  reservation.guest.language || 'en',
              checkIn:        new Date(reservation.arrival_date),
              checkOut:       new Date(reservation.departure_date),
            },
          });
          await pushToRoom(server, room.id, { type: 'REFRESH_CONFIG' });
          break;
        }

        case 'reservation.checked_out':
        case 'reservation.cancelled': {
          await server.prisma.roomGuest.deleteMany({
            where: { roomId: room.id, exelyReservationId: reservation.id },
          });
          await pushToRoom(server, room.id, { type: 'CLEAR_GUEST' });
          break;
        }

        case 'reservation.modified': {
          await server.prisma.roomGuest.updateMany({
            where: { roomId: room.id, exelyReservationId: reservation.id },
            data: {
              guestFirstName: reservation.guest.first_name,
              guestLastName:  reservation.guest.last_name,
              checkIn:        new Date(reservation.arrival_date),
              checkOut:       new Date(reservation.departure_date),
            },
          });
          await pushToRoom(server, room.id, { type: 'REFRESH_CONFIG' });
          break;
        }

        default:
          server.log.info({ event }, 'Exely: unhandled event type');
      }

      return { ok: true };
    },
  );
}

async function findGuestId(server: FastifyInstance, roomId: string, reservationId: string): Promise<string | null> {
  const existing = await server.prisma.roomGuest.findFirst({
    where: { roomId, exelyReservationId: reservationId },
    select: { id: true },
  });
  return existing?.id ?? null;
}
