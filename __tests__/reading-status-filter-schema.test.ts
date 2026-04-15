import { ReadingStatus } from "@/generated/prisma/client";
import { readingStatusFilterSchema } from "@/lib/trpc/routers/books/shared";
import { describe, expect, test } from "vitest";

describe("readingStatusFilterSchema", () => {
  test("uses an empty default", () => {
    expect(readingStatusFilterSchema.parse(undefined)).toBe("");
  });

  test("accepts known status values", () => {
    expect(readingStatusFilterSchema.parse(ReadingStatus.READING)).toBe(ReadingStatus.READING);
    expect(readingStatusFilterSchema.parse(ReadingStatus.COMPLETED)).toBe(ReadingStatus.COMPLETED);
  });

  test("rejects unknown status values", () => {
    expect(() => readingStatusFilterSchema.parse("finished")).toThrow();
  });
});
