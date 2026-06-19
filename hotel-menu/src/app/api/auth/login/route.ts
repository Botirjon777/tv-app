import { cookies } from "next/headers";
import {
  checkPassword,
  createToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/auth";
import { loginInput } from "@/lib/validation";
import { fail, handle, ok } from "@/lib/http";

export async function POST(req: Request) {
  return handle(async () => {
    const body = await req.json().catch(() => ({}));
    const { role, password } = loginInput.parse(body);

    if (!checkPassword(role, password)) {
      return fail("Incorrect password", 401);
    }

    const token = await createToken(role);
    cookies().set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return ok({ role });
  });
}
