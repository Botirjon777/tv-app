import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth";

// Gate /admin and /pos behind the password cookie. The login pages and the
// auth API are always reachable.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifyToken(token);
  const role = session?.role ?? null;

  const isAdmin = pathname.startsWith("/admin");
  const isPos = pathname.startsWith("/pos");

  // Login pages are public.
  if (pathname === "/admin/login" || pathname === "/pos/login") {
    return NextResponse.next();
  }

  if (isAdmin) {
    // Only the admin role may enter the admin panel.
    if (role !== "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (isPos) {
    // admin or pos may use the POS.
    if (role !== "pos" && role !== "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/pos/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/pos/:path*"],
};
