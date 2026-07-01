/* Centralised environment validation.
 *
 * Validated ONCE at boot (see index.ts). If a required variable is missing or
 * malformed the process exits immediately with a clear message — we never want
 * to discover a missing JWT_SECRET on the first admin login in production.
 *
 * Import `env` anywhere instead of reaching into `process.env` directly so that
 * every consumer gets the parsed, type-safe, already-validated values.
 */
import { z } from 'zod';

const isProd = process.env.NODE_ENV === 'production';

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    HOST: z.string().default('0.0.0.0'),

    // Core infra — always required.
    DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid URL' }),
    REDIS_URL: z.string().min(1),

    // Auth — JWT secret must be long enough to be meaningful.
    JWT_SECRET: z
      .string()
      .min(32, 'JWT_SECRET must be at least 32 characters (64+ recommended)')
      .refine((v) => !/change_me/i.test(v), 'JWT_SECRET still contains the placeholder value'),

    // Single-admin credentials. Optional in dev, required in prod so the admin
    // API can never be reached in a half-configured (503) state.
    ADMIN_EMAIL: z.string().email().optional(),
    ADMIN_PASSWORD_HASH: z.string().min(20).optional(),

    // Internal data bridge shared secret. Required in prod — the /menu/data
    // route is a raw Prisma bridge and must never be publicly reachable.
    INTERNAL_API_KEY: z.string().min(16).optional(),

    // Optional integrations — the app degrades gracefully when unset.
    EXELY_WEBHOOK_SECRET: z.string().min(1).optional(),
    OPENWEATHER_API_KEY: z.string().min(1).optional(),
    TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
    TELEGRAM_CHAT_ID: z.string().min(1).optional(),

    // CORS: comma-separated allowlist, or "*" (blocked in prod, see below).
    CORS_ORIGIN: z.string().default('*'),

    // Rate limiting — tunable without a code change.
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
    RATE_LIMIT_WINDOW: z.string().default('1 minute'),

    // Media.
    MEDIA_DIR: z.string().default('uploads'),
    PUBLIC_BASE_URL: z.string().default(''),
    MAX_UPLOAD_MB: z.coerce.number().int().positive().default(50),
  })
  .superRefine((cfg, ctx) => {
    if (cfg.NODE_ENV === 'production') {
      if (!cfg.ADMIN_EMAIL || !cfg.ADMIN_PASSWORD_HASH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'ADMIN_EMAIL and ADMIN_PASSWORD_HASH are required in production (generate the hash with `npm run hash:password`).',
        });
      }
      if (!cfg.INTERNAL_API_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'INTERNAL_API_KEY is required in production (protects the /menu/data Prisma bridge).',
        });
      }
      if (!cfg.EXELY_WEBHOOK_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'EXELY_WEBHOOK_SECRET is required in production (webhook forgery protection).',
        });
      }
      if (cfg.CORS_ORIGIN.trim() === '*') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CORS_ORIGIN must be an explicit origin allowlist in production, not "*".',
        });
      }
    }
  });

export type Env = z.infer<typeof schema>;

declare module 'fastify' {
  interface FastifyInstance {
    env: Env;
  }
}

let cached: Env | null = null;

/** Parse & validate process.env once. Exits the process on failure. */
export function loadEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  • ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    // eslint-disable-next-line no-console
    console.error(`\n❌ Invalid environment configuration:\n${issues}\n`);
    process.exit(1);
  }
  cached = parsed.data;
  return cached;
}

/** Parsed CORS origins as an array, or true for wildcard (dev only). */
export function corsOrigin(env: Env): string[] | boolean {
  const raw = env.CORS_ORIGIN.trim();
  if (raw === '*' || raw === '') return true;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

export const IS_PROD = isProd;
