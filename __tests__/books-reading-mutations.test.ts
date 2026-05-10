import { BookType, ProgressType, ReadThroughStatus, ReadingStatus } from "@/generated/prisma/client";
import { booksRouter } from "@/lib/trpc/routers/books";
import { beforeEach, describe, expect, test, vi } from "vitest";

const tx = {
  userBook: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  readThrough: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
};

const { prisma } = vi.hoisted(() => ({
  prisma: {
    $transaction: vi.fn(),
    book: { findUniqueOrThrow: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma }));

function createCaller() {
  return booksRouter.createCaller({
    headers: new Headers(),
    session: { user: { id: "user-1", isAdmin: false } },
  } as never);
}

const physicalBook = { type: BookType.PHYSICAL, pageCount: 320, audioSeconds: null };
const audiobook = { type: BookType.AUDIOBOOK, pageCount: null, audioSeconds: 6000 };

beforeEach(() => {
  vi.clearAllMocks();
  prisma.$transaction.mockImplementation((cb: (t: typeof tx) => Promise<unknown>) => cb(tx));
});

describe("setBookStatus", () => {
  test("creates a want-to-read intent when no user book exists", async () => {
    prisma.book.findUniqueOrThrow.mockResolvedValue(physicalBook);
    tx.userBook.findUnique.mockResolvedValue(null);
    tx.userBook.create.mockResolvedValue({ id: "ub-1", wantsToRead: false, status: null });
    tx.readThrough.findFirst.mockResolvedValue(null);
    tx.userBook.update.mockResolvedValue({ status: ReadingStatus.WANT_TO_READ });

    const result = await createCaller().setBookStatus({
      bookId: "book-1",
      status: ReadingStatus.WANT_TO_READ,
    });

    expect(tx.userBook.create).toHaveBeenCalled();
    expect(tx.userBook.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ wantsToRead: true, status: ReadingStatus.WANT_TO_READ }),
      }),
    );
    expect(result).toEqual({ status: ReadingStatus.WANT_TO_READ, requiresConfirmation: false, warning: null });
  });

  test("resumes a paused read-through when switching to READING", async () => {
    prisma.book.findUniqueOrThrow.mockResolvedValue(physicalBook);
    tx.userBook.findUnique.mockResolvedValue({
      id: "ub-1",
      wantsToRead: false,
      status: ReadingStatus.PAUSED,
    });
    tx.readThrough.findFirst
      .mockResolvedValueOnce({ id: "rt-1", status: ReadThroughStatus.PAUSED, progress: 50 })
      .mockResolvedValueOnce({ id: "rt-1", status: ReadThroughStatus.READING, progress: 50 });
    tx.readThrough.update.mockResolvedValue({});
    tx.userBook.update.mockResolvedValue({ status: ReadingStatus.READING });

    const result = await createCaller().setBookStatus({
      bookId: "book-1",
      status: ReadingStatus.READING,
    });

    expect(tx.readThrough.update).toHaveBeenCalledWith({
      where: { id: "rt-1" },
      data: { status: ReadThroughStatus.READING, stoppedAt: null },
    });
    expect(result.status).toBe(ReadingStatus.READING);
  });
});

describe("setReadingProgress", () => {
  test("clamps progress to max and auto-completes the read-through", async () => {
    prisma.book.findUniqueOrThrow.mockResolvedValue(physicalBook);
    tx.userBook.findUnique.mockResolvedValue(null);
    tx.userBook.create.mockResolvedValue({ id: "ub-1", wantsToRead: false, status: null });
    tx.readThrough.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "rt-1", status: ReadThroughStatus.COMPLETED, progress: 320 });
    tx.readThrough.create.mockResolvedValue({});
    tx.userBook.update.mockResolvedValue({ status: ReadingStatus.COMPLETED });

    const result = await createCaller().setReadingProgress({ bookId: "book-1", progress: 999 });

    expect(tx.readThrough.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          progress: 320,
          status: ReadThroughStatus.COMPLETED,
        }),
      }),
    );
    expect(result).toEqual({
      progress: 320,
      status: ReadingStatus.COMPLETED,
      autoCompleted: true,
      progressType: ProgressType.PAGES,
      maxProgress: 320,
    });
  });

  test("resumes a paused read-through updating its progress", async () => {
    prisma.book.findUniqueOrThrow.mockResolvedValue(audiobook);
    tx.userBook.findUnique.mockResolvedValue({
      id: "ub-1",
      wantsToRead: false,
      status: ReadingStatus.PAUSED,
    });
    tx.readThrough.findFirst
      .mockResolvedValueOnce({ id: "rt-1", status: ReadThroughStatus.PAUSED, progress: 300 })
      .mockResolvedValueOnce({ id: "rt-1", status: ReadThroughStatus.READING, progress: 900 });
    tx.readThrough.update.mockResolvedValue({});
    tx.userBook.update.mockResolvedValue({ status: ReadingStatus.READING });

    const result = await createCaller().setReadingProgress({ bookId: "book-1", progress: 900 });

    expect(tx.readThrough.update).toHaveBeenCalledWith({
      where: { id: "rt-1" },
      data: { progress: 900, status: ReadThroughStatus.READING, stoppedAt: null },
    });
    expect(result.status).toBe(ReadingStatus.READING);
    expect(result.progressType).toBe(ProgressType.TIME);
    expect(result.maxProgress).toBe(6000);
  });
});
