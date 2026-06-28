/* TV-facing routes: /room/config, /room/ping, /hotel/services, /ws */
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { getWeather } from '../services/weatherService';
import { roomChannel } from '../services/pushService';

/** Resolve room from X-Device-Token header; throws 401/404 as needed */
async function resolveRoom(server: FastifyInstance, req: FastifyRequest) {
  const token = req.headers['x-device-token'] as string | undefined;
  if (!token) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });

  const room = await server.prisma.room.findUnique({
    where: { deviceToken: token },
    include: {
      hotel: true,
      guests: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!room) throw Object.assign(new Error('Device not registered'), { statusCode: 401 });
  return room;
}

export async function roomRoutes(server: FastifyInstance) {
  /* ── GET /room/config ─────────────────────────────────────────────── */
  server.get('/room/config', async (req, reply) => {
    const room  = await resolveRoom(server, req);
    const hotel = room.hotel;
    const guest = room.guests[0] ?? null;

    const weather = await getWeather(server, hotel.city, hotel.countryCode);

    // Services
    const services = await server.prisma.hotelService.findMany({
      where:   { hotelId: hotel.id, available: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Active announcements
    const now = new Date();
    const announcements = await server.prisma.hotelContent.findMany({
      where: {
        hotelId:     hotel.id,
        contentType: 'announcement',
        active:      true,
        OR: [
          { displayFrom: null },
          { displayFrom: { lte: now } },
        ],
        AND: [
          { OR: [{ displayUntil: null }, { displayUntil: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Compute nights remaining
    let nightsRemaining: number | null = null;
    if (guest) {
      const msPerDay = 86_400_000;
      nightsRemaining = Math.max(
        0,
        Math.ceil((guest.checkOut.getTime() - Date.now()) / msPerDay),
      );
    }

    return {
      room: {
        id:            room.id,
        roomNumber:    room.roomNumber,
        floor:         room.floor,
        backgroundUrl: room.backgroundUrl ?? hotel.logoUrl ?? null,
      },
      hotel: {
        name:     hotel.name,
        city:     hotel.city,
        timezone: hotel.timezone,
        logoUrl:  hotel.logoUrl ?? null,
      },
      guest: guest ? {
        firstName:       guest.guestFirstName,
        lastName:        guest.guestLastName,
        language:        guest.guestLanguage,
        checkIn:         guest.checkIn.toISOString().split('T')[0],
        checkOut:        guest.checkOut.toISOString().split('T')[0],
        nightsRemaining,
      } : null,
      weather,
      services: services.map((s) => ({
        id:       s.id,
        label:    s.label,
        iconUrl:  s.iconUrl ?? null,
        available: s.available,
        deepLink: s.deepLink ?? null,
      })),
      announcements: announcements.map((a) => ({
        id:       a.id,
        title:    a.title,
        body:     a.body,
        priority: a.priority ?? 'info',
      })),
    };
  });

  /* ── GET /room/ping ───────────────────────────────────────────────── */
  server.get('/room/ping', async (req) => {
    const token = req.headers['x-device-token'] as string | undefined;
    if (token) {
      await server.prisma.room.updateMany({
        where: { deviceToken: token },
        data:  { lastSeenAt: new Date() },
      });
    }
    return { pong: true };
  });

  /* ── GET /hotel/services ──────────────────────────────────────────── */
  server.get('/hotel/services', async (req) => {
    const room = await resolveRoom(server, req);
    const services = await server.prisma.hotelService.findMany({
      where:   { hotelId: room.hotelId, available: true },
      orderBy: { sortOrder: 'asc' },
    });
    return services;
  });

  /* ── GET /hotel/content/:type ─────────────────────────────────────── */
  server.get<{ Params: { type: string } }>('/hotel/content/:type', async (req) => {
    const room = await resolveRoom(server, req);
    const now  = new Date();
    const items = await server.prisma.hotelContent.findMany({
      where: {
        hotelId:     room.hotelId,
        contentType: req.params.type as never,
        active:      true,
        OR: [{ displayFrom: null }, { displayFrom: { lte: now } }],
        AND: [{ OR: [{ displayUntil: null }, { displayUntil: { gte: now } }] }],
      },
      orderBy: { createdAt: 'desc' },
    });
    return items;
  });

  /* ── WS /ws ───────────────────────────────────────────────────────── */
  server.get('/ws', { websocket: true }, async (socket, req) => {
    const token = (req.query as Record<string, string>)?.token;
    if (!token) { socket.close(4001, 'Missing token'); return; }

    const room = await server.prisma.room.findUnique({ where: { deviceToken: token } });
    if (!room) { socket.close(4001, 'Unknown device'); return; }

    // Update last seen
    await server.prisma.room.update({
      where: { id: room.id },
      data:  { lastSeenAt: new Date() },
    });

    const channel = roomChannel(room.id);

    // Subscribe to this room's Redis channel
    const sub = server.redisSub.duplicate();
    await sub.subscribe(channel);

    sub.on('message', (_chan: string, msg: string) => {
      if (socket.readyState === socket.OPEN) socket.send(msg);
    });

    socket.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString()) as { type: string };
        if (msg.type === 'PING') socket.send(JSON.stringify({ type: 'PONG' }));
        if (msg.type === 'PONG') { /* handled by client watchdog */ }
      } catch { /* ignore */ }
    });

    socket.on('close', () => {
      sub.unsubscribe(channel);
      sub.quit();
    });
  });
}
