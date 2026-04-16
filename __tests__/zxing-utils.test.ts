import { isExpectedZxingDecodeError } from "@/lib/utils/zxing";
import { describe, expect, test } from "vitest";

describe("isExpectedZxingDecodeError", () => {
  test("treats NotFoundException by name as expected", () => {
    expect(isExpectedZxingDecodeError({ name: "NotFoundException" })).toBe(true);
    expect(isExpectedZxingDecodeError({ name: "NotFound" })).toBe(true);
  });

  test("treats minified decode miss message as expected", () => {
    expect(
      isExpectedZxingDecodeError({ name: "e", message: "No MultiFormat Readers were able to detect the code." }),
    ).toBe(true);
  });

  test("treats non-decode runtime errors as fatal", () => {
    expect(isExpectedZxingDecodeError(new Error("Camera stream unexpectedly ended"))).toBe(false);
    expect(isExpectedZxingDecodeError({ name: "TypeError", message: "Cannot read properties of undefined" })).toBe(
      false,
    );
  });
});
