import { cookies } from "next/headers";
import {
  checkPassword,
  createToken,
  resolveRoleByEmail,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/auth";
import { loginInput } from "@/lib/validation";
import { fail, handle, ok } from "@/lib/http";

export async function POST(req: Request) {
  return handle(async () => {
    const body = await req.json().catch(() => ({}));
    const { role, email, password } = loginInput.parse(body);

    // Email login (native apps) resolves the role from the credentials;
    // role login (web forms) checks the password for the given role.
    const resolvedRole = email
      ? resolveRoleByEmail(email, password)
      : role && checkPassword(role, password)
        ? role
        : null;

    if (!resolvedRole) {
      return fail(email ? "Incorrect email or password" : "Incorrect password", 401);
    }

    const token = await createToken(resolvedRole);
    cookies().set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return ok({ role: resolvedRole });
  });
}
