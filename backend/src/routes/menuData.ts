/* Hotel-menu data API.
 *
 * The hotel-menu Next.js app used to talk to its own SQLite database via a
 * local Prisma client. It now persists through this backend instead: its
 * `lib/prisma.ts` forwards each `model.operation(args)` call here, and we run
 * the exact same Prisma operation against Postgres. Because the same Prisma
 * engine executes the query, semantics (where / include / orderBy / nested
 * create / _count / aggregate) are identical — the hotel-menu route handlers
 * are unchanged.
 *
 * Only the menu models are reachable, and only the operations listed below.
 * The hotel-menu model names `hotel`/`room` map to the MenuHotel/MenuRoom
 * Prisma delegates (renamed to avoid colliding with the TV platform's models).
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// hotel-menu model name -> Prisma client delegate name.
const MODEL_MAP: Record<string, string> = {
  category: 'category',
  product: 'product',
  recommendation: 'recommendation',
  hotel: 'menuHotel',
  room: 'menuRoom',
  order: 'order',
  orderItem: 'orderItem',
};

// Operations the hotel-menu app is allowed to invoke.
const ALLOWED_OPS = new Set([
  'findMany',
  'findUnique',
  'findFirst',
  'count',
  'aggregate',
  'groupBy',
  'create',
  'createMany',
  'update',
  'updateMany',
  'upsert',
  'delete',
  'deleteMany',
]);

export async function menuDataRoutes(server: FastifyInstance) {
  server.post(
    '/menu/data/:model/:op',
    async (req: FastifyRequest, reply: FastifyReply) => {
      // Optional shared-secret guard (set INTERNAL_API_KEY to enable).
      const key = process.env.INTERNAL_API_KEY;
      if (key && req.headers['x-internal-key'] !== key) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { model, op } = req.params as { model: string; op: string };
      const delegate = MODEL_MAP[model];
      if (!delegate) {
        return reply.status(400).send({ error: `Unknown model "${model}"` });
      }
      if (!ALLOWED_OPS.has(op)) {
        return reply.status(400).send({ error: `Operation "${op}" not allowed` });
      }

      const args = (req.body ?? {}) as Record<string, unknown>;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (server.prisma as any)[delegate][op](args);
        return reply.send({ data: result });
      } catch (err) {
        // Surface the Prisma error (code + message) so the caller can mirror
        // whatever behaviour it relied on. hotel-menu pre-checks constraints,
        // so this is mostly a backstop.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = err as any;
        req.log.error({ err: e, model, op }, 'menu data api error');
        return reply
          .status(400)
          .send({ error: e?.message ?? 'Data operation failed', code: e?.code ?? null });
      }
    }
  );
}
