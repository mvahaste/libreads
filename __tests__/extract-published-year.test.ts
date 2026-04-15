import { extractPublishedYear } from "@/lib/books/extract-published-year";
import { describe, expect, test } from "vitest";

describe("extractPublishedYear", () => {
  test.each([
    ["1990", 1990],
    ["1990-02-15", 1990],
    ["1990/02/15", 1990],
    ["Published in 2004", 2004],
    ["c. 1998", 1998],
    ["1990/1991", 1990],
  ])("%s -> %i", (input, expected) => {
    expect(extractPublishedYear(input)).toBe(expected);
  });

  test.each([["Not a date"], [""]])("%s -> null", (input) => {
    expect(extractPublishedYear(input)).toBeUndefined();
  });
});
