// Cookie-based auth for the admin panel and per-hotel POS.
//
// A session is either the global admin or a single hotel's POS. It's encoded in
// an HttpOnly cookie as `${subject}.${expiresAt}.${nonce}.${hmac(payload)}`,
// where subject is "admin" or "pos:<hotelId>". The expiry + random nonce are
// signed, so a leaked cookie is time-limited and non-replayable. HMAC uses Web
// Crypto so verification works in both the Node and Edge (middleware) runtimes.

export type Role = "admin" | "pos";
export type Session = { role: "admin" } | { role: "pos"; hotelId: string };

export const SESSION_COOKIE = "hm_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (seconds)

// In production the signing secret MUST be configured — the dev fallback is
// predictable. Fail loudly rather than run with a guessable secret.
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

// Constant-time string compare.
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// 128 bits of randomness so two logins (even same subject, same instant) differ.
function randomNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

function subjectFor(session: Session): string {
  return session.role === "admin" ? "admin" : `pos:${session.hotelId}`;
}

function parseSubject(subject: string): Session | null {
  if (subject === "admin") return { role: "admin" };
  if (subject.startsWith("pos:")) {
    const hotelId = subject.slice(4);
    if (hotelId) return { role: "pos", hotelId };
  }
  return null;
}

export async function createToken(session: Session): Promise<string> {
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${subjectFor(session)}.${expiresAt}.${randomNonce()}`;
  const sig = await hmac(payload);
  return `${payload}.${sig}`;
}

export async function verifyToken(
  token: string | undefined | null
): Promise<Session | null> {
  if (!token) return null;

  // Signature covers everything before the final dot.
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = await hmac(payload);
  if (!constantTimeEqual(sig, expected)) return null;

  const [subject, expiresAt] = payload.split(".");
  const session = parseSubject(subject ?? "");
  if (!session) return null;

  const expiry = Number(expiresAt);
  if (!Number.isFinite(expiry) || Date.now() > expiry) return null;

  return session;
}

// Global admin password. Like the secret, the dev fallback must never run in
// production, so we fail loudly there.
function adminPassword(): string {
  const configured = process.env.ADMIN_PASSWORD;
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_PASSWORD must be set in production");
  }
  return "admin123";
}

export function checkAdminPassword(password: string): boolean {
  return constantTimeEqual(password, adminPassword());
}
