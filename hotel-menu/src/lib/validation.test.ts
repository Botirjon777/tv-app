import { describe, it, expect } from "vitest";
import { orderInput, productInput, loginInput } from "./validation";

describe("orderInput", () => {
  it("accepts a valid order", () => {
    const result = orderInput.safeParse({
      hotelSlug: "grand",
      roomNumber: "101",
      items: [{ productId: "p1", quantity: 2 }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty cart", () => {
    const result = orderInput.safeParse({
      hotelSlug: "grand",
      roomNumber: "101",
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it("defaults the note to an empty string", () => {
    const parsed = orderInput.parse({
      hotelSlug: "grand",
      roomNumber: "101",
      items: [{ productId: "p1", quantity: 1 }],
    });
    expect(parsed.note).toBe("");
  });
});

describe("productInput", () => {
  it("rejects negative prices", () => {
    const result = productInput.safeParse({
      name: "Tea",
      price: -1,
      categoryId: "c1",
    });
    expect(result.success).toBe(false);
  });

  it("requires a category", () => {
    const result = productInput.safeParse({
      name: "Tea",
      price: 1000,
      categoryId: "",
    });
    expect(result.success).toBe(false);
  });

  it("applies sensible defaults", () => {
    const parsed = productInput.parse({
      name: "Tea",
      price: 1000,
      categoryId: "c1",
    });
    expect(parsed.available).toBe(true);
    expect(parsed.sourceLang).toBe("en");
    expect(parsed.description).toBe("");
  });
});

describe("loginInput", () => {
  it("accepts a role + password (web forms)", () => {
    expect(loginInput.safeParse({ role: "admin", password: "x" }).success).toBe(
      true
    );
  });

  it("accepts an email + password (native apps)", () => {
    expect(
      loginInput.safeParse({ email: "a@b.com", password: "x" }).success
    ).toBe(true);
  });

  it("rejects when neither role nor email is provided", () => {
    expect(loginInput.safeParse({ password: "x" }).success).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(loginInput.safeParse({ role: "admin", password: "" }).success).toBe(
      false
    );
  });
});
