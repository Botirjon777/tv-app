import { cookies } from "next/headers";
import { SESSION_COOKIE, verifyToken, type Role } from "./auth";

// Server-side helper for route handlers / server components to read the
// authenticated role from the request cookies.
export async function getServerRole(): Promise<Role | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifyToken(token);
}

// Throw-free guard for API route handlers. Returns the role or null.
export async function requireRole(allowed: Role[]): Promise<Role | null> {
  const role = await getServerRole();
  if (!role) return null;
  // admin can do everything pos can.
  if (allowed.includes(role)) return role;
  if (role === "admin") return role;
  return null;
}
