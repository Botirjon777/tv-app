/* Device registration — POST /devices/register */
import { randomBytes } from 'crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const RegisterSchema = z.object({
  hotel_id:    z.string().uuid(),
  room_number: z.string().min(1).max(20),
  device_type: z.enum(['android_tv', 'tizen']).optional().default('tizen'),
});

export async function deviceRoutes(server: FastifyInstance) {
  server.post('/devices/register', {
    // Registration creates a room row + mints a token — tighter than global.
    config: { rateLimit: { max: 20, timeWindow: '1 hour' } },
  }, async (req, reply) => {
    const parse = RegisterSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.flatten() });
    }

    const { hotel_id, room_number, device_type } = parse.data;

    const hotel = await server.prisma.hotel.findUnique({ where: { id: hotel_id } });
    if (!hotel) return reply.status(404).send({ error: 'Hotel not found' });

    // Find or create the room record
    const existing = await server.prisma.room.findFirst({
      where: { hotelId: hotel_id, roomNumber: room_number },
    });

    if (existing) {
      // Re-register: rotate token (staff may call this on device reset)
      const deviceToken = randomBytes(32).toString('hex');
      const room = await server.prisma.room.update({
        where: { id: existing.id },
        data:  { deviceToken, deviceType: device_type },
      });
      return { device_token: room.deviceToken, room_id: room.id };
    }

    const deviceToken = randomBytes(32).toString('hex');
    const room = await server.prisma.room.create({
      data: {
        hotelId:     hotel_id,
        roomNumber:  room_number,
        deviceToken,
        deviceType:  device_type,
      },
    });

    return reply.status(201).send({ device_token: room.deviceToken, room_id: room.id });
  });
}
