/* Shared authentication guards.
 *
 * `requireAdmin` verifies a valid JWT AND that it carries the hotel_admin role,
 * so a token minted for any other purpose can never reach admin routes. Use it
 * as a route `preHandler`. */
import type { FastifyReply, FastifyRequest } from 'fastify';

interface AdminClaims {
  email?: string;
  role?: string;
}

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await req.jwtVerify();
  } catch {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
  const claims = req.user as AdminClaims;
  if (claims?.role !== 'hotel_admin') {
    return reply.status(403).send({ error: 'Forbidden' });
  }
}
