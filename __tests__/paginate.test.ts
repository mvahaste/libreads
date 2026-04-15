import { paginate } from "@/lib/trpc/routers/books";
import { describe, expect, test } from "vitest";

describe("paginate", () => {
  test("page 1, pageSize 24", () => {
    const result = paginate(1, 24);
    expect(result).toEqual({ skip: 0, take: 24 });
  });

  test("page 3, pageSize 24", () => {
    const result = paginate(3, 24);
    expect(result).toEqual({ skip: 48, take: 24 });
  });
});
