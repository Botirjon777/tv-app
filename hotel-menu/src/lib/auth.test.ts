import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import {
  createToken,
  verifyToken,
  checkAdminPassword,
  SESSION_MAX_AGE,
} from "./auth";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret";
  process.env.ADMIN_PASSWORD = "admin-pw";
});

afterEach(() => {
  vi.useRealTimers();
});

describe("token round-trip", () => {
  it("verifies an admin session", async () => {
    expect(await verifyToken(await createToken({ role: "admin" }))).toEqual({
      role: "admin",
    });
  });

  it("verifies a pos session carrying its hotel id", async () => {
    const token = await createToken({ role: "pos", hotelId: "hotel-123" });
    expect(await verifyToken(token)).toEqual({
      role: "pos",
      hotelId: "hotel-123",
    });
  });

  it("issues a distinct token on each login (nonce)", async () => {
    expect(await createToken({ role: "admin" })).not.toBe(
      await createToken({ role: "admin" })
    );
  });
});

describe("tampering", () => {
  it("rejects a token whose subject was swapped", async () => {
    const token = await createToken({ role: "pos", hotelId: "h1" });
    expect(await verifyToken(token.replace(/^pos:h1/, "admin"))).toBeNull();
  });

  it("rejects a token with a broken signature", async () => {
    const token = await createToken({ role: "admin" });
    const last = token[token.length - 1];
    const tampered = token.slice(0, -1) + (last === "a" ? "b" : "a");
    expect(await verifyToken(tampered)).toBeNull();
  });

  it("rejects empty and malformed tokens", async () => {
    expect(await verifyToken(undefined)).toBeNull();
    expect(await verifyToken("")).toBeNull();
    expect(await verifyToken("garbage")).toBeNull();
  });
});

describe("expiry", () => {
  it("rejects a token past its expiry", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const token = await createToken({ role: "admin" });
    vi.setSystemTime(Date.now() + (SESSION_MAX_AGE + 60) * 1000);
    expect(await verifyToken(token)).toBeNull();
  });

  it("accepts a token still within its lifetime", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const token = await createToken({ role: "pos", hotelId: "h9" });
    vi.setSystemTime(Date.now() + (SESSION_MAX_AGE - 60) * 1000);
    expect(await verifyToken(token)).toEqual({ role: "pos", hotelId: "h9" });
  });
});

describe("checkAdminPassword", () => {
  it("accepts the configured admin password", () => {
    expect(checkAdminPassword("admin-pw")).toBe(true);
  });

  it("rejects a wrong password", () => {
    expect(checkAdminPassword("nope")).toBe(false);
  });
});
