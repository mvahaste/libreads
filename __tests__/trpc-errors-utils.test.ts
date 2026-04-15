import { applyMappedFieldError, getTrpcErrorCode } from "@/lib/utils/trpc-errors";
import { describe, expect, test, vi } from "vitest";

describe("getTrpcErrorCode", () => {
  test("prefers message when it is a string", () => {
    expect(getTrpcErrorCode({ message: "BAD_REQUEST" })).toBe("BAD_REQUEST");
  });

  test("falls back to data.code when message is unavailable", () => {
    expect(getTrpcErrorCode({ data: { code: "CONFLICT" } })).toBe("CONFLICT");
  });

  test("returns undefined for unsupported values", () => {
    expect(getTrpcErrorCode(null)).toBeUndefined();
    expect(getTrpcErrorCode({ message: 123 })).toBeUndefined();
  });
});

describe("applyMappedFieldError", () => {
  test("applies mapped field error and returns true", () => {
    const setFieldError = vi.fn();

    const didApply = applyMappedFieldError({
      error: { message: "EMAIL_ALREADY_IN_USE" },
      map: {
        EMAIL_ALREADY_IN_USE: {
          field: "email",
          message: "Email is already in use",
        },
      },
      setFieldError,
    });

    expect(didApply).toBe(true);
    expect(setFieldError).toHaveBeenCalledWith("email", "Email is already in use");
  });

  test("returns false when code cannot be mapped", () => {
    const setFieldError = vi.fn();

    const didApply = applyMappedFieldError({
      error: { message: "UNKNOWN" },
      map: {
        EMAIL_ALREADY_IN_USE: {
          field: "email",
          message: "Email is already in use",
        },
      },
      setFieldError,
    });

    expect(didApply).toBe(false);
    expect(setFieldError).not.toHaveBeenCalled();
  });
});
