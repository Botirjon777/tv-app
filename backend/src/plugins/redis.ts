import Redis from 'ioredis';
import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    redis:    Redis;
    redisSub: Redis; // subscriber — cannot send commands after subscribe()
  }
}

async function redisPlugin(server: FastifyInstance) {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  // family: 0 enables dual-stack DNS so ioredis can reach Railway's
  // IPv6-only private network hostnames (*.railway.internal).
  const redis    = new Redis(url, { lazyConnect: true, family: 0 });
  const redisSub = new Redis(url, { lazyConnect: true, family: 0 });

  await redis.connect();
  await redisSub.connect();

  server.decorate('redis',    redis);
  server.decorate('redisSub', redisSub);

  server.addHook('onClose', async () => {
    await redis.quit();
    await redisSub.quit();
  });
}

export default fp(redisPlugin);
export { redisPlugin };
