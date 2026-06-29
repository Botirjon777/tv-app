import { cookies } from "next/headers";
import {
  checkAdminPassword,
  constantTimeEqual,
  createToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  type Session,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginInput } from "@/lib/validation";
import { fail, handle, ok } from "@/lib/http";

export async function POST(req: Request) {
  return handle(async () => {
    const body = await req.json().catch(() => ({}));
    const { role, connectCode, password } = loginInput.parse(body);

    // POS signs in per hotel with its connect code + password; admin is global.
    let session: Session | null = null;
    if (connectCode) {
      const hotel = await prisma.hotel.findUnique({ where: { connectCode } });
      if (
        hotel &&
        hotel.active &&
        hotel.posPassword &&
        constantTimeEqual(password, hotel.posPassword)
      ) {
        session = { role: "pos", hotelId: hotel.id };
      }
    } else if (role === "admin" && checkAdminPassword(password)) {
      session = { role: "admin" };
    }

    if (!session) {
      return fail(
        connectCode ? "Incorrect code or password" : "Incorrect password",
        401
      );
    }

    const token = await createToken(session);
    cookies().set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return ok(
      session.role === "pos"
        ? { role: "pos", hotelId: session.hotelId }
        : { role: "admin" }
    );
  });
}
