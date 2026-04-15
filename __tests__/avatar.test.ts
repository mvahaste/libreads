import { getAvatarFallback } from "@/lib/utils/avatar";
import { describe, expect, test } from "vitest";

describe("getAvatarFallback", () => {
  test("returns U for empty values", () => {
    expect(getAvatarFallback(undefined)).toBe("U");
    expect(getAvatarFallback("")).toBe("U");
    expect(getAvatarFallback("   ")).toBe("U");
  });

  test("builds initials from provided names", () => {
    expect(getAvatarFallback("John Doe")).toBe("JD");
    expect(getAvatarFallback("Ada")).toBe("A");
    expect(getAvatarFallback("mary jane watson")).toBe("MJ");
  });
});
