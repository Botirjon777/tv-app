import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import {
  createToken,
  verifyToken,
  checkPassword,
  resolveRoleByEmail,
  SESSION_MAX_AGE,
} from "./auth";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret";
  process.env.ADMIN_PASSWORD = "admin-pw";
  process.env.POS_PASSWORD = "pos-pw";
  process.env.ADMIN_EMAIL = "admin@example.com";
  process.env.POS_EMAIL = "kitchen@example.com";
});

afterEach(() => {
  vi.useRealTimers();
});

describe("token round-trip", () => {
  it("verifies a freshly created admin token", async () => {
    expect(await verifyToken(await createToken("admin"))).toBe("admin");
  });

  it("verifies a freshly created pos token", async () => {
    expect(await verifyToken(await createToken("pos"))).toBe("pos");
  });

  it("issues a distinct token on each login (nonce)", async () => {
    expect(await createToken("admin")).not.toBe(await createToken("admin"));
  });
});

describe("tampering", () => {
  it("rejects a token whose role was swapped", async () => {
    const token = await createToken("pos");
    expect(await verifyToken(token.replace(/^pos/, "admin"))).toBeNull();
  });

  it("rejects a token with a broken signature", async () => {
    const token = await createToken("admin");
    expect(await verifyToken(`${token.slice(0, -1)}0`)).toBeNull();
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
    const token = await createToken("admin");
    vi.setSystemTime(Date.now() + (SESSION_MAX_AGE + 60) * 1000);
    expect(await verifyToken(token)).toBeNull();
  });

  it("accepts a token still within its lifetime", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const token = await createToken("admin");
    vi.setSystemTime(Date.now() + (SESSION_MAX_AGE - 60) * 1000);
    expect(await verifyToken(token)).toBe("admin");
  });
});

describe("checkPassword", () => {
  it("accepts the configured password for a role", () => {
    expect(checkPassword("admin", "admin-pw")).toBe(true);
    expect(checkPassword("pos", "pos-pw")).toBe(true);
  });

  it("rejects a wrong password", () => {
    expect(checkPassword("admin", "nope")).toBe(false);
  });

  it("does not accept another role's password", () => {
    expect(checkPassword("admin", "pos-pw")).toBe(false);
  });
});

describe("resolveRoleByEmail", () => {
  it("resolves a role, ignoring case and surrounding whitespace", () => {
    expect(resolveRoleByEmail("  Admin@Example.com ", "admin-pw")).toBe("admin");
    expect(resolveRoleByEmail("kitchen@example.com", "pos-pw")).toBe("pos");
  });

  it("returns null for a wrong password", () => {
    expect(resolveRoleByEmail("admin@example.com", "wrong")).toBeNull();
  });

  it("returns null for an unknown email", () => {
    expect(resolveRoleByEmail("nobody@example.com", "admin-pw")).toBeNull();
  });
});
