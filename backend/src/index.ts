import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import multipart from '@fastify/multipart';

import { loadEnv, corsOrigin } from './config/env';
import securityPlugin from './plugins/security';
import { prismaPlugin } from './plugins/prisma';
import { redisPlugin } from './plugins/redis';
import { mediaPlugin } from './plugins/media';
import { roomRoutes } from './routes/room';
import { webhookRoutes } from './routes/webhooks';
import { adminRoutes } from './routes/admin';
import { deviceRoutes } from './routes/devices';
import { menuDataRoutes } from './routes/menuData';
import { menuApiRoutes } from './routes/menuApi';
import { serviceRequestRoutes } from './routes/serviceRequests';

// Fail fast on any missing / malformed configuration before we open a socket.
const env = loadEnv();

const server = Fastify({
  // Behind Caddy/nginx: honour X-Forwarded-* so req.ip is the real client (used
  // by the rate limiter) and the scheme is correct.
  trustProxy: true,
  // Cap JSON bodies. Multipart uploads have their own (larger) limit below.
  bodyLimit: 1 * 1024 * 1024, // 1 MB
  // Don't echo back a header that advertises the framework.
  disableRequestLogging: false,
  logger: {
    redact: ['req.headers.authorization', 'req.headers["x-device-token"]', 'req.headers["x-internal-key"]'],
    transport:
      env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
});

// Capture the raw request body for JSON payloads so webhook HMAC verification
// can hash the exact bytes the sender signed (JSON.stringify(req.body) is NOT
// byte-identical and would break signature checks).
server.addContentTypeParser(
  'application/json',
  { parseAs: 'buffer' },
  (req, body: Buffer, done) => {
    (req as unknown as { rawBody?: Buffer }).rawBody = body;
    if (body.length === 0) return done(null, {});
    try {
      done(null, JSON.parse(body.toString('utf8')));
    } catch (err) {
      (err as Error & { statusCode?: number }).statusCode = 400;
      done(err as Error, undefined);
    }
  },
);

// Uniform error handler — never leak stack traces / internals in production.
server.setErrorHandler((error, req, reply) => {
  const status = error.statusCode ?? 500;
  if (status >= 500) {
    req.log.error({ err: error }, 'unhandled error');
  }
  const message =
    status >= 500 && env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message;
  reply.status(status).send({ error: message });
});

server.setNotFoundHandler((req, reply) => {
  reply.status(404).send({ error: 'Not found' });
});

async function bootstrap() {
  // Expose the validated env to plugins that need it.
  server.decorate('env', env);

  await server.register(securityPlugin, { env });

  await server.register(cors, {
    origin: corsOrigin(env),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  await server.register(jwt, { secret: env.JWT_SECRET });

  await server.register(multipart, {
    limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
  });

  await server.register(websocket);
  await server.register(prismaPlugin);
  await server.register(redisPlugin);
  await server.register(mediaPlugin);

  await server.register(roomRoutes, { prefix: '/api/v1' });
  await server.register(webhookRoutes, { prefix: '/api/v1' });
  await server.register(adminRoutes, { prefix: '/api/v1' });
  await server.register(deviceRoutes, { prefix: '/api/v1' });
  await server.register(menuDataRoutes, { prefix: '/api/v1' });
  await server.register(menuApiRoutes, { prefix: '/api/v1' });
  await server.register(serviceRequestRoutes, { prefix: '/api/v1' });

  server.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

  await server.listen({ port: env.PORT, host: env.HOST });

  // Graceful shutdown: stop accepting connections and let plugins close (Prisma
  // disconnect, Redis quit) so we don't drop in-flight requests on a redeploy.
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, async () => {
      server.log.info({ signal }, 'shutting down');
      await server.close();
      process.exit(0);
    });
  }
}

bootstrap().catch((err) => {
  server.log.error(err);
  process.exit(1);
});
