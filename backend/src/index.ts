import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import multipart from '@fastify/multipart';

import { prismaPlugin } from './plugins/prisma';
import { redisPlugin } from './plugins/redis';
import { roomRoutes } from './routes/room';
import { webhookRoutes } from './routes/webhooks';
import { adminRoutes } from './routes/admin';
import { deviceRoutes } from './routes/devices';
import { menuDataRoutes } from './routes/menuData';
import { menuApiRoutes } from './routes/menuApi';
import { serviceRequestRoutes } from './routes/serviceRequests';

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
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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
  await server.register(serviceRequestRoutes, { prefix: '/api/v1' });

  server.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

  const port = parseInt(process.env.PORT || '3000', 10);
  const host = process.env.HOST || '0.0.0.0';
  await server.listen({ port, host });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
