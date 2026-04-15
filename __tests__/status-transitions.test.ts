import { BookType, ProgressType, ReadThroughStatus, ReadingStatus } from "@/generated/prisma/client";
import {
  getMaxProgress,
  inferProgressType,
  isReadThroughActive,
  isReadThroughClosed,
  readingStatusToReadThroughStatus,
  recomputeBookStatus,
} from "@/lib/books/status-transitions";
import { describe, expect, test } from "vitest";

const physicalBook = {
  type: BookType.PHYSICAL,
  pageCount: 320,
  audioSeconds: null,
} as const;

const audiobook = {
  type: BookType.AUDIOBOOK,
  pageCount: null,
  audioSeconds: 7200,
} as const;

describe("inferProgressType", () => {
  test("uses pages when pageCount is available", () => {
    expect(inferProgressType(physicalBook)).toBe(ProgressType.PAGES);
  });

  test("uses time for audiobooks with duration", () => {
    expect(inferProgressType(audiobook)).toBe(ProgressType.TIME);
  });

  test("falls back to percentage", () => {
    expect(
      inferProgressType({
        type: BookType.EBOOK,
        pageCount: null,
        audioSeconds: null,
      }),
    ).toBe(ProgressType.PERCENTAGE);
  });
});

describe("getMaxProgress", () => {
  test("returns the max for each progress mode", () => {
    expect(getMaxProgress(ProgressType.PAGES, physicalBook)).toBe(320);
    expect(getMaxProgress(ProgressType.TIME, audiobook)).toBe(7200);
    expect(getMaxProgress(ProgressType.PERCENTAGE, physicalBook)).toBe(100);
  });
});

describe("isReadThroughActive", () => {
  test("returns true only for active read-through statuses", () => {
    expect(isReadThroughActive(ReadThroughStatus.READING)).toBe(true);
    expect(isReadThroughActive(ReadThroughStatus.PAUSED)).toBe(true);
    expect(isReadThroughActive(ReadThroughStatus.COMPLETED)).toBe(false);
    expect(isReadThroughActive(ReadThroughStatus.ABANDONED)).toBe(false);
  });
});

describe("isReadThroughClosed", () => {
  test("returns true only for closed read-through statuses", () => {
    expect(isReadThroughClosed(ReadThroughStatus.READING)).toBe(false);
    expect(isReadThroughClosed(ReadThroughStatus.PAUSED)).toBe(false);
    expect(isReadThroughClosed(ReadThroughStatus.COMPLETED)).toBe(true);
    expect(isReadThroughClosed(ReadThroughStatus.ABANDONED)).toBe(true);
  });
});

describe("readingStatusToReadThroughStatus", () => {
  test("maps reading statuses to read-through statuses", () => {
    expect(readingStatusToReadThroughStatus(ReadingStatus.READING)).toBe(ReadThroughStatus.READING);
    expect(readingStatusToReadThroughStatus(ReadingStatus.PAUSED)).toBe(ReadThroughStatus.PAUSED);
    expect(readingStatusToReadThroughStatus(ReadingStatus.COMPLETED)).toBe(ReadThroughStatus.COMPLETED);
    expect(readingStatusToReadThroughStatus(ReadingStatus.ABANDONED)).toBe(ReadThroughStatus.ABANDONED);
    expect(readingStatusToReadThroughStatus(ReadingStatus.WANT_TO_READ)).toBeNull();
  });
});

describe("recomputeBookStatus", () => {
  test("uses the latest read-through status first", () => {
    expect(
      recomputeBookStatus({
        latestReadThroughStatus: ReadThroughStatus.ABANDONED,
        wantsToRead: true,
      }),
    ).toBe(ReadingStatus.ABANDONED);
  });

  test("falls back to want-to-read intent when no read-through exists", () => {
    expect(
      recomputeBookStatus({
        latestReadThroughStatus: null,
        wantsToRead: true,
      }),
    ).toBe(ReadingStatus.WANT_TO_READ);
  });

  test("returns null when there is no read-through and no want-to-read intent", () => {
    expect(
      recomputeBookStatus({
        latestReadThroughStatus: null,
        wantsToRead: false,
      }),
    ).toBeNull();
  });
});
