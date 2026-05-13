import { formatDurationForDisplay, formatDurationForInput, parseDurationInputToSeconds } from "@/lib/utils/duration";
import { describe, expect, test } from "vitest";

describe("formatDurationForDisplay", () => {
  test("always renders h/m/s for user-facing output", () => {
    expect(formatDurationForDisplay(0)).toBe("0h 0m 0s");
    expect(formatDurationForDisplay(65)).toBe("0h 1m 5s");
    expect(formatDurationForDisplay(3661)).toBe("1h 1m 1s");
  });

  test("handles very large hour values", () => {
    expect(formatDurationForDisplay(3600 * 123 + 10)).toBe("123h 0m 10s");
  });
});

describe("formatDurationForInput", () => {
  test("formats as HH:MM:SS", () => {
    expect(formatDurationForInput(0)).toBe("00:00:00");
    expect(formatDurationForInput(65)).toBe("00:01:05");
    expect(formatDurationForInput(3661)).toBe("01:01:01");
  });

  test("does not break for 100+ hours", () => {
    expect(formatDurationForInput(3600 * 123)).toBe("123:00:00");
  });
});

describe("parseDurationInputToSeconds", () => {
  test("parses strict HH:MM:SS values", () => {
    expect(parseDurationInputToSeconds("00:00:00")).toBe(0);
    expect(parseDurationInputToSeconds("01:01:01")).toBe(3661);
    expect(parseDurationInputToSeconds("123:45:59")).toBe(445559);
  });

  test("rejects invalid input", () => {
    expect(parseDurationInputToSeconds("1:2:3")).toBeNull();
    expect(parseDurationInputToSeconds("01:99:00")).toBeNull();
    expect(parseDurationInputToSeconds("01:59")).toBeNull();
    expect(parseDurationInputToSeconds("abc")).toBeNull();
  });
});
