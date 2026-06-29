import { cookies } from "next/headers";
import { SESSION_COOKIE, verifyToken, type Role, type Session } from "./auth";

// Read the authenticated session (admin, or a specific hotel's POS) from cookies.
export async function getServerSession(): Promise<Session | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifyToken(token);
}

// Return the session if its role is allowed (admin can do everything pos can),
// otherwise null. Use when a handler needs the hotel scope (e.g. POS orders).
export async function requireSession(allowed: Role[]): Promise<Session | null> {
  const session = await getServerSession();
  if (!session) return null;
  if (allowed.includes(session.role) || session.role === "admin") return session;
  return null;
}

// Throw-free role guard for the many write routes that only need a yes/no.
export async function requireRole(allowed: Role[]): Promise<Role | null> {
  const session = await requireSession(allowed);
  return session ? session.role : null;
}
