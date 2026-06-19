import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: number | ResponseInit) {
  const responseInit =
    typeof init === "number" ? { status: init } : init;
  return NextResponse.json(data, responseInit);
}

export function fail(message: string, status = 400, extra?: unknown) {
  return NextResponse.json(
    { error: message, ...(extra ? { details: extra } : {}) },
    { status }
  );
}

export function unauthorized() {
  return fail("Unauthorized", 401);
}

export function notFound(what = "Resource") {
  return fail(`${what} not found`, 404);
}

// Wrap an async handler with uniform Zod / error handling.
export async function handle(
  fn: () => Promise<Response>
): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ZodError) {
      return fail("Validation failed", 422, err.flatten());
    }
    console.error("[api] unhandled error:", err);
    return fail("Internal server error", 500);
  }
}
