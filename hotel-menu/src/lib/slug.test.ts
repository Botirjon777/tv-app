import { describe, it, expect } from "vitest";
import { slugify, generateRooms } from "./slug";

describe("slugify", () => {
  it("lowercases and joins words with dashes", () => {
    expect(slugify("Grand Plaza Hotel")).toBe("grand-plaza-hotel");
  });

  it("strips accents", () => {
    expect(slugify("Café Münchën")).toBe("cafe-munchen");
  });

  it("collapses runs of non-alphanumerics into a single dash", () => {
    expect(slugify("a & b @ c")).toBe("a-b-c");
  });

  it("trims leading and trailing separators", () => {
    expect(slugify("  --Hello!!  ")).toBe("hello");
  });

  it("returns an empty string when nothing usable remains", () => {
    expect(slugify("!!!")).toBe("");
  });
});

describe("generateRooms", () => {
  it("numbers rooms as <floor><zero-padded index>", () => {
    const numbers = generateRooms(2, 3).map((r) => r.number);
    expect(numbers).toEqual(["101", "102", "103", "201", "202", "203"]);
  });

  it("sets the floor and a default name", () => {
    expect(generateRooms(1, 1)[0]).toEqual({
      number: "101",
      floor: 1,
      name: "Room 101",
    });
  });

  it("returns nothing when there are no floors", () => {
    expect(generateRooms(0, 5)).toEqual([]);
  });
});
