import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";
import { handle, ok } from "@/lib/http";

export async function POST() {
  return handle(async () => {
    cookies().delete(SESSION_COOKIE);
    return ok({ ok: true });
  });
}
