// Minimal cookie-based auth for the admin panel and POS.
//
// A successful login sets an HttpOnly cookie holding `${role}.${hmac(role)}`.
// The HMAC is computed with Web Crypto so the same verification works in both
// the Node runtime (route handlers) and the Edge runtime (middleware).

export type Role = "admin" | "pos";

export const SESSION_COOKIE = "hm_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  return process.env.AUTH_SECRET || "insecure-dev-secret";
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

export async function createToken(role: Role): Promise<string> {
  const sig = await hmac(role);
  return `${role}.${sig}`;
}

export async function verifyToken(
  token: string | undefined | null
): Promise<Role | null> {
  if (!token) return null;
  const idx = token.indexOf(".");
  if (idx === -1) return null;
  const role = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  if (role !== "admin" && role !== "pos") return null;
  const expected = await hmac(role);
  return safeEqual(sig, expected) ? (role as Role) : null;
}

// Validate a submitted password against the configured value for a role.
export function checkPassword(role: Role, password: string): boolean {
  const expected =
    role === "admin"
      ? process.env.ADMIN_PASSWORD || "admin123"
      : process.env.POS_PASSWORD || "kitchen123";
  return password === expected;
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
    if (normalized === emailForRole(role).toLowerCase() && checkPassword(role, password)) {
      return role;
    }
  }
  return null;
}
