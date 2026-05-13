import { BookType, ProgressType, ReadThroughStatus, ReadingStatus } from "@/generated/prisma/client";

export interface BookForTransition {
  type: BookType;
  pageCount: number | null;
  audioSeconds: number | null;
}

export function isReadThroughActive(status: ReadThroughStatus): boolean {
  return status === ReadThroughStatus.READING || status === ReadThroughStatus.PAUSED;
}

export function isReadThroughClosed(status: ReadThroughStatus): boolean {
  return status === ReadThroughStatus.COMPLETED || status === ReadThroughStatus.ABANDONED;
}

export function readThroughStatusToReadingStatus(status: ReadThroughStatus): ReadingStatus {
  switch (status) {
    case ReadThroughStatus.READING:
      return ReadingStatus.READING;
    case ReadThroughStatus.PAUSED:
      return ReadingStatus.PAUSED;
    case ReadThroughStatus.COMPLETED:
      return ReadingStatus.COMPLETED;
    case ReadThroughStatus.ABANDONED:
      return ReadingStatus.ABANDONED;
  }
}

export function readingStatusToReadThroughStatus(status: ReadingStatus): ReadThroughStatus | null {
  switch (status) {
    case ReadingStatus.READING:
      return ReadThroughStatus.READING;
    case ReadingStatus.PAUSED:
      return ReadThroughStatus.PAUSED;
    case ReadingStatus.COMPLETED:
      return ReadThroughStatus.COMPLETED;
    case ReadingStatus.ABANDONED:
      return ReadThroughStatus.ABANDONED;
    case ReadingStatus.WANT_TO_READ:
      return null;
  }
}

export function recomputeBookStatus(params: {
  latestReadThroughStatus: ReadThroughStatus | null;
  wantsToRead: boolean;
}): ReadingStatus | null {
  if (params.latestReadThroughStatus) {
    return readThroughStatusToReadingStatus(params.latestReadThroughStatus);
  }

  if (params.wantsToRead) {
    return ReadingStatus.WANT_TO_READ;
  }

  return null;
}

export function inferProgressType(book: BookForTransition): ProgressType {
  if (book.type === BookType.AUDIOBOOK && book.audioSeconds) return ProgressType.TIME;
  if (book.pageCount) return ProgressType.PAGES;
  return ProgressType.PERCENTAGE;
}

export function getMaxProgress(progressType: ProgressType, book: BookForTransition): number {
  switch (progressType) {
    case ProgressType.PAGES:
      return book.pageCount ?? 100;
    case ProgressType.TIME:
      return book.audioSeconds ?? 100;
    case ProgressType.PERCENTAGE:
      return 100;
  }
}
