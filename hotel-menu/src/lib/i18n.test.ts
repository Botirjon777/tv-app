import { describe, it, expect } from "vitest";
import { parseI18n, resolveText, isLang } from "./i18n";

describe("parseI18n", () => {
  it("parses a valid JSON map", () => {
    expect(parseI18n('{"en":"Tea","ru":"Чай"}')).toEqual({ en: "Tea", ru: "Чай" });
  });

  it("returns an empty map for null / undefined / empty input", () => {
    expect(parseI18n(null)).toEqual({});
    expect(parseI18n(undefined)).toEqual({});
    expect(parseI18n("")).toEqual({});
  });

  it("returns an empty map for malformed JSON", () => {
    expect(parseI18n("{not json")).toEqual({});
  });

  it("returns an empty map for non-object JSON", () => {
    expect(parseI18n("42")).toEqual({});
  });
});

describe("resolveText", () => {
  const text = { en: "Water", ru: "Вода" };

  it("returns the requested language when present", () => {
    expect(resolveText(text, "ru")).toBe("Вода");
  });

  it("falls back to English when the language is missing", () => {
    expect(resolveText(text, "uz")).toBe("Water");
  });

  it("falls back to the provided default when nothing matches", () => {
    expect(resolveText({}, "uz", "n/a")).toBe("n/a");
    expect(resolveText(undefined, "en", "n/a")).toBe("n/a");
  });
});

describe("isLang", () => {
  it("recognizes supported languages", () => {
    expect(isLang("en")).toBe(true);
    expect(isLang("ru")).toBe(true);
    expect(isLang("uz")).toBe(true);
  });

  it("rejects unsupported languages", () => {
    expect(isLang("fr")).toBe(false);
  });
});
