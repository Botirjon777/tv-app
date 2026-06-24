import { describe, it, expect } from "vitest";
import { serializeOrder } from "./serialize";

describe("serializeOrder", () => {
  it("maps a fully-populated order to a DTO", () => {
    const dto = serializeOrder({
      id: "o1",
      roomId: "r1",
      status: "PENDING",
      note: "no onions",
      total: 50000,
      createdAt: new Date("2026-06-24T10:00:00Z"),
      updatedAt: new Date("2026-06-24T10:05:00Z"),
      room: {
        number: "101",
        hotelId: "h1",
        hotel: { id: "h1", slug: "grand", name: "Grand" },
      },
      items: [
        { id: "i1", productId: "p1", name: "Tea", price: 10000, quantity: 2 },
      ],
    });

    expect(dto).toEqual({
      id: "o1",
      roomId: "r1",
      roomNumber: "101",
      hotelId: "h1",
      hotelSlug: "grand",
      hotelName: "Grand",
      status: "PENDING",
      note: "no onions",
      total: 50000,
      items: [
        { id: "i1", productId: "p1", name: "Tea", price: 10000, quantity: 2 },
      ],
      createdAt: "2026-06-24T10:00:00.000Z",
      updatedAt: "2026-06-24T10:05:00.000Z",
    });
  });

  it("falls back gracefully when the room/hotel relation is missing", () => {
    const dto = serializeOrder({
      id: "o2",
      roomId: "r9",
      status: "PENDING",
      note: "",
      total: 0,
      createdAt: new Date("2026-06-24T10:00:00Z"),
      updatedAt: new Date("2026-06-24T10:00:00Z"),
      room: null,
      items: [],
    });

    expect(dto.roomNumber).toBe("?");
    expect(dto.hotelId).toBe("");
    expect(dto.hotelSlug).toBe("");
    expect(dto.hotelName).toBe("");
  });
});
