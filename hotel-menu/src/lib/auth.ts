// Minimal cookie-based auth for the admin panel and POS.
//
// A successful login sets an HttpOnly cookie holding a signed token of the form
// `${role}.${expiresAt}.${nonce}.${hmac(payload)}`. Because the expiry and a
// random nonce are part of the signed payload, every login produces a distinct,
// time-limited token: a leaked cookie stops working at `expiresAt`, and tokens
// can't be replayed once expired. The HMAC is computed with Web Crypto so the
// same verification works in both the Node runtime (route handlers) and the
// Edge runtime (middleware).

export type Role = "admin" | "pos";

export const SESSION_COOKIE = "hm_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (seconds)

// In production the signing secret MUST be configured — an attacker who knows
// the dev fallback could forge an admin token. We fail loudly rather than run
// with a predictable secret. In dev/test we allow the fallback for convenience.
function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set in production");
  }
  return "insecure-dev-secret";
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(value: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return toHex(sig);
}

// Constant-time-ish string compare.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// 128 bits of randomness so two logins (even same role, same instant) differ.
function randomNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

export async function createToken(role: Role): Promise<string> {
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${role}.${expiresAt}.${randomNonce()}`;
  const sig = await hmac(payload);
  return `${payload}.${sig}`;
}

export async function verifyToken(
  token: string | undefined | null
): Promise<Role | null> {
  if (!token) return null;

  // Signature covers everything before the final dot.
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = await hmac(payload);
  if (!safeEqual(sig, expected)) return null;

  const [role, expiresAt] = payload.split(".");
  if (role !== "admin" && role !== "pos") return null;

  const expiry = Number(expiresAt);
  if (!Number.isFinite(expiry) || Date.now() > expiry) return null;

  return role as Role;
}

// Configured password per role. Like the signing secret, the predictable dev
// fallbacks must never be used in production, so we fail loudly there.
function passwordForRole(role: Role): string {
  const envVar = role === "admin" ? "ADMIN_PASSWORD" : "POS_PASSWORD";
  const configured = process.env[envVar];
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${envVar} must be set in production`);
  }
  return role === "admin" ? "admin123" : "kitchen123";
}

// Validate a submitted password against the configured value for a role.
export function checkPassword(role: Role, password: string): boolean {
  return safeEqual(password, passwordForRole(role));
}

// Configured login email per role (env-based, no users table). Mirrors the
// admin convention used elsewhere in the project.
function emailForRole(role: Role): string {
  return role === "admin"
    ? process.env.ADMIN_EMAIL || "admin@gmail.com"
    : process.env.POS_EMAIL || "kitchen@gmail.com";
}

// Resolve a role from an email + password pair. Returns null if neither the
// admin nor POS credentials match. Used by native apps that sign in by email.
export function resolveRoleByEmail(
  email: string,
  password: string
): Role | null {
  const normalized = email.trim().toLowerCase();
  for (const role of ["admin", "pos"] as const) {
    if (
      safeEqual(normalized, emailForRole(role).toLowerCase()) &&
      checkPassword(role, password)
    ) {
      return role;
    }
  }
  return null;
}
