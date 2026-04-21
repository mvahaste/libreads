import { getMaxProgressForDisplay, getProgressPercent } from "@/lib/books/progress-display";
import { describe, expect, test } from "vitest";

describe("getMaxProgressForDisplay", () => {
  test("uses page count for page-based progress", () => {
    expect(
      getMaxProgressForDisplay({
        progressType: "PAGES",
        pageCount: 320,
        audioSeconds: null,
      }),
    ).toBe(320);
  });

  test("uses audio duration for time-based progress", () => {
    expect(
      getMaxProgressForDisplay({
        progressType: "TIME",
        pageCount: null,
        audioSeconds: 7200,
      }),
    ).toBe(7200);
  });

  test("falls back to 100 when metadata is missing", () => {
    expect(
      getMaxProgressForDisplay({
        progressType: "PAGES",
        pageCount: null,
        audioSeconds: null,
      }),
    ).toBe(100);

    expect(
      getMaxProgressForDisplay({
        progressType: "TIME",
        pageCount: null,
        audioSeconds: null,
      }),
    ).toBe(100);

    expect(
      getMaxProgressForDisplay({
        progressType: "PERCENTAGE",
        pageCount: null,
        audioSeconds: null,
      }),
    ).toBe(100);
  });
});

describe("getProgressPercent", () => {
  test("returns rounded percent for partial progress", () => {
    expect(
      getProgressPercent({
        progress: 111,
        progressType: "PAGES",
        pageCount: 320,
        audioSeconds: null,
      }),
    ).toBe(35);
  });

  test("returns 100 at completion", () => {
    expect(
      getProgressPercent({
        progress: 320,
        progressType: "PAGES",
        pageCount: 320,
        audioSeconds: null,
      }),
    ).toBe(100);
  });

  test("returns 0 for zero progress", () => {
    expect(
      getProgressPercent({
        progress: 0,
        progressType: "PERCENTAGE",
        pageCount: null,
        audioSeconds: null,
      }),
    ).toBe(0);
  });

  test("clamps values outside the 0-100 range", () => {
    expect(
      getProgressPercent({
        progress: -10,
        progressType: "PAGES",
        pageCount: 320,
        audioSeconds: null,
      }),
    ).toBe(0);

    expect(
      getProgressPercent({
        progress: 999,
        progressType: "PAGES",
        pageCount: 320,
        audioSeconds: null,
      }),
    ).toBe(100);
  });
});
