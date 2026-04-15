import { mapUniqueConstraintError } from "@/lib/trpc/error-mappers";
import { describe, expect, test } from "vitest";

describe("mapUniqueConstraintError", () => {
  test("returns null for non-prisma errors", () => {
    expect(mapUniqueConstraintError(new Error("boom"), { email: "EMAIL_EXISTS" })).toBeNull();
    expect(mapUniqueConstraintError(null, { email: "EMAIL_EXISTS" })).toBeNull();
  });

  test("returns null for non-P2002 error codes", () => {
    const error = {
      code: "P2025",
      meta: { target: ["email"] },
    };

    expect(mapUniqueConstraintError(error, { email: "EMAIL_EXISTS" })).toBeNull();
  });

  test("maps array unique targets", () => {
    const error = {
      code: "P2002",
      meta: { target: ["email"] },
    };

    const mapped = mapUniqueConstraintError(error, { email: "EMAIL_ALREADY_IN_USE" });

    expect(mapped?.code).toBe("CONFLICT");
    expect(mapped?.message).toBe("EMAIL_ALREADY_IN_USE");
  });

  test("maps string unique targets using partial matching", () => {
    const error = {
      code: "P2002",
      meta: { target: "Tag_userId_name_key" },
    };

    const mapped = mapUniqueConstraintError(error, {
      userId_name: "TAG_ALREADY_EXISTS",
    });

    expect(mapped?.code).toBe("CONFLICT");
    expect(mapped?.message).toBe("TAG_ALREADY_EXISTS");
  });

  test("returns null when target does not match mapped fields", () => {
    const error = {
      code: "P2002",
      meta: { target: ["slug"] },
    };

    expect(mapUniqueConstraintError(error, { email: "EMAIL_ALREADY_IN_USE" })).toBeNull();
  });
});
