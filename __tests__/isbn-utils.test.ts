import {
  isIsbn10Format,
  isIsbn13Format,
  isValidIsbn10Checksum,
  isValidIsbn13Checksum,
  normalizeAndValidateIsbn,
  sanitizeIsbnInput,
} from "@/lib/utils/isbn";
import { describe, expect, test } from "vitest";

describe("sanitizeIsbnInput", () => {
  test("keeps digits and X only", () => {
    expect(sanitizeIsbnInput("ISBN 978-0-306-40615-7")).toBe("9780306406157");
    expect(sanitizeIsbnInput("0-8044-2957-x")).toBe("080442957X");
  });
});

describe("format checks", () => {
  test("validates ISBN-10 shape", () => {
    expect(isIsbn10Format("080442957X")).toBe(true);
    expect(isIsbn10Format("0306406152")).toBe(true);
    expect(isIsbn10Format("030640615A")).toBe(false);
  });

  test("validates ISBN-13 shape", () => {
    expect(isIsbn13Format("9780306406157")).toBe(true);
    expect(isIsbn13Format("978030640615X")).toBe(false);
  });
});

describe("checksum checks", () => {
  test("accepts and rejects ISBN-10 checksums", () => {
    expect(isValidIsbn10Checksum("0306406152")).toBe(true);
    expect(isValidIsbn10Checksum("080442957X")).toBe(true);
    expect(isValidIsbn10Checksum("0306406153")).toBe(false);
  });

  test("accepts and rejects ISBN-13 checksums", () => {
    expect(isValidIsbn13Checksum("9780306406157")).toBe(true);
    expect(isValidIsbn13Checksum("9783161484100")).toBe(true);
    expect(isValidIsbn13Checksum("9780306406158")).toBe(false);
  });
});

describe("normalizeAndValidateIsbn", () => {
  test("normalizes valid ISBN-13 input", () => {
    expect(normalizeAndValidateIsbn("ISBN 978-0-306-40615-7")).toEqual({
      type: "ISBN13",
      value: "9780306406157",
    });
  });

  test("normalizes valid ISBN-10 input", () => {
    expect(normalizeAndValidateIsbn("0-8044-2957-x")).toEqual({
      type: "ISBN10",
      value: "080442957X",
    });
  });

  test("returns null for invalid or unsupported values", () => {
    expect(normalizeAndValidateIsbn("9780306406158")).toBeNull();
    expect(normalizeAndValidateIsbn("not-an-isbn")).toBeNull();
    expect(normalizeAndValidateIsbn("123456789")).toBeNull();
  });
});
