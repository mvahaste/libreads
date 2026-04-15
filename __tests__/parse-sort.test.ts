import { parseSort } from "@/lib/trpc/routers/books";
import { describe, expect, test } from "vitest";

describe("parseSort", () => {
  test("title-asc", () => {
    const sort = parseSort("title-asc");

    expect(sort).not.toBeNull();
    expect(sort!.field).toBe("title");
    expect(sort!.dir).toBe("asc");
  });

  test("invalid", () => {
    expect(parseSort("invalid")).toBeNull();
    expect(parseSort("titleasc")).toBeNull();
    expect(parseSort("title-ascending")).toBeNull();
    expect(parseSort("title-descending")).toBeNull();
  });

  test("empty string", () => {
    expect(parseSort("")).toBeNull();
  });
});
