import { mapEditionFormat } from "@/lib/books/format-mapper";
import { describe, expect, test } from "vitest";

describe("mapEditionFormat", () => {
  test("physical formats", () => {
    expect(mapEditionFormat("Paperback")).toBe("PHYSICAL");
    expect(mapEditionFormat("Hardcover")).toBe("PHYSICAL");
    expect(mapEditionFormat("Mass Market Paperback")).toBe("PHYSICAL");
    expect(mapEditionFormat("Tapa Blanda")).toBe("PHYSICAL");
  });

  test("ebook formats", () => {
    expect(mapEditionFormat("Kindle")).toBe("EBOOK");
    expect(mapEditionFormat("Kindle Edition")).toBe("EBOOK");
    expect(mapEditionFormat("ebook")).toBe("EBOOK");
    expect(mapEditionFormat("e-book")).toBe("EBOOK");
    expect(mapEditionFormat("ePub")).toBe("EBOOK");
    expect(mapEditionFormat("PDF")).toBe("EBOOK");
    expect(mapEditionFormat("Nook")).toBe("EBOOK");
  });

  test("audiobook formats", () => {
    expect(mapEditionFormat("Audiobook")).toBe("AUDIOBOOK");
    expect(mapEditionFormat("Audible Audio")).toBe("AUDIOBOOK");
    expect(mapEditionFormat("Audio CD")).toBe("AUDIOBOOK");
  });

  test("null, undefined, and empty string default to PHYSICAL", () => {
    expect(mapEditionFormat(null)).toBe("PHYSICAL");
    expect(mapEditionFormat(undefined)).toBe("PHYSICAL");
    expect(mapEditionFormat("")).toBe("PHYSICAL");
    expect(mapEditionFormat("   ")).toBe("PHYSICAL");
  });

  test("unknown formats default to PHYSICAL", () => {
    expect(mapEditionFormat("Library Binding")).toBe("PHYSICAL");
    expect(mapEditionFormat("Board Book")).toBe("PHYSICAL");
    expect(mapEditionFormat("Spiral-bound")).toBe("PHYSICAL");
  });

  test("case insensitive", () => {
    expect(mapEditionFormat("KINDLE")).toBe("EBOOK");
    expect(mapEditionFormat("audiobook")).toBe("AUDIOBOOK");
    expect(mapEditionFormat("HARDCOVER")).toBe("PHYSICAL");
  });
});
