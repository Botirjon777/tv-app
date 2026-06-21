import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import multipart from '@fastify/multipart';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { join, normalize, extname } from 'path';

import { prismaPlugin } from './plugins/prisma';
import { redisPlugin } from './plugins/redis';
import { roomRoutes } from './routes/room';
import { webhookRoutes } from './routes/webhooks';
import { adminRoutes } from './routes/admin';
import { deviceRoutes } from './routes/devices';
import { menuDataRoutes } from './routes/menuData';
import { menuApiRoutes } from './routes/menuApi';

const server = Fastify({
  logger: {
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
});

async function bootstrap() {
  await server.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  await server.register(jwt, {
    secret: process.env.JWT_SECRET!,
  });

  await server.register(multipart, {
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  });

  await server.register(websocket);
  await server.register(prismaPlugin);
  await server.register(redisPlugin);

  await server.register(roomRoutes,    { prefix: '/api/v1' });
  await server.register(webhookRoutes, { prefix: '/api/v1' });
  await server.register(adminRoutes,   { prefix: '/api/v1' });
  await server.register(deviceRoutes,  { prefix: '/api/v1' });
  await server.register(menuDataRoutes, { prefix: '/api/v1' });
  await server.register(menuApiRoutes,  { prefix: '/api/v1' });

  server.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

  // Locally-hosted images (food photos, wallpapers) so TVs never depend on an
  // external CDN — served from backend/public/img. e.g. GET /img/foods/x.jpg
  const PUBLIC_DIR = join(__dirname, '..', 'public');
  const MIME: Record<string, string> = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  };
  server.get('/img/*', async (req, reply) => {
    const rel = normalize((req.params as { '*': string })['*']).replace(/^(\.\.[/\\])+/, '');
    const filePath = join(PUBLIC_DIR, 'img', rel);
    if (!filePath.startsWith(join(PUBLIC_DIR, 'img'))) {
      return reply.code(403).send({ error: 'Forbidden' });
    }
    try {
      const s = await stat(filePath);
      if (!s.isFile()) throw new Error('not a file');
      reply
        .type(MIME[extname(filePath).toLowerCase()] || 'application/octet-stream')
        .header('Cache-Control', 'public, max-age=31536000, immutable');
      return reply.send(createReadStream(filePath));
    } catch {
      return reply.code(404).send({ error: 'Not found' });
    }
  });

  const port = parseInt(process.env.PORT || '3000', 10);
  const host = process.env.HOST || '0.0.0.0';
  await server.listen({ port, host });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
