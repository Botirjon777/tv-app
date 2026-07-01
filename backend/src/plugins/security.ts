/* Baseline HTTP hardening: security headers (helmet) + global rate limiting.
 *
 * Registered early in the bootstrap so it wraps every route. Per-route stricter
 * limits (e.g. the admin login) are layered on top via each route's config. */
import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import type { Env } from '../config/env';

async function securityPlugin(server: FastifyInstance, opts: { env: Env }) {
  const { env } = opts;

  // Security headers. contentSecurityPolicy is disabled because this service is
  // a JSON/media API (no HTML app served), and a strict CSP would otherwise
  // block cross-origin media embeds on the TV clients.
  await server.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  });

  // Global IP-based rate limit. Trusts X-Forwarded-For only because the app is
  // configured with trustProxy (see index.ts) behind the Caddy/nginx proxy.
  await server.register(rateLimit, {
    global: true,
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
    // Health checks shouldn't be throttled.
    allowList: (req) => req.url === '/health',
    keyGenerator: (req) => req.ip,
    // Use the plugin's default error (a real Error carrying statusCode 429) so
    // our global error handler renders a proper 429 — a custom builder that
    // returns a plain object is thrown without a statusCode and becomes a 500.
  });
}

export default fp(securityPlugin);
export { securityPlugin };
