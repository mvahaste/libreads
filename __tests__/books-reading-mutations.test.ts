import { BookType, ProgressType, ReadThroughStatus, ReadingStatus } from "@/generated/prisma/client";
import { booksRouter } from "@/lib/trpc/routers/books";
import { beforeEach, describe, expect, test, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  prisma: (() => {
    const userBook = {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    const readThrough = {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    };

    return {
      book: {
        findUniqueOrThrow: vi.fn(),
        findUnique: vi.fn(),
      },
      userBook,
      readThrough,
      $transaction: vi.fn(),
    };
  })(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock.prisma,
}));

function createCaller() {
  return booksRouter.createCaller({
    headers: new Headers(),
    session: {
      user: {
        id: "user-1",
        isAdmin: false,
      },
    } as never,
  });
}

beforeEach(() => {
  prismaMock.prisma.$transaction.mockReset();
  prismaMock.prisma.$transaction.mockImplementation(async (callback: (tx: typeof prismaMock.prisma) => unknown) =>
    callback(prismaMock.prisma),
  );

  for (const mock of [
    prismaMock.prisma.book.findUniqueOrThrow,
    prismaMock.prisma.book.findUnique,
    prismaMock.prisma.userBook.create,
    prismaMock.prisma.userBook.update,
    prismaMock.prisma.userBook.findUnique,
    prismaMock.prisma.readThrough.findFirst,
    prismaMock.prisma.readThrough.create,
    prismaMock.prisma.readThrough.update,
    prismaMock.prisma.readThrough.findUnique,
    prismaMock.prisma.readThrough.delete,
  ]) {
    mock.mockReset();
  }
});

describe("books router reading mutations", () => {
  test("setBookStatus sets want-to-read intent when there are no read-throughs", async () => {
    prismaMock.prisma.book.findUniqueOrThrow.mockResolvedValue({
      type: BookType.PHYSICAL,
      pageCount: 320,
      audioSeconds: null,
    });
    prismaMock.prisma.userBook.findUnique.mockResolvedValue(null);
    prismaMock.prisma.userBook.create.mockResolvedValue({
      id: "user-book-1",
      wantsToRead: false,
      status: null,
    });
    prismaMock.prisma.readThrough.findFirst.mockResolvedValueOnce(null);
    prismaMock.prisma.userBook.update.mockResolvedValueOnce({
      status: ReadingStatus.WANT_TO_READ,
    });

    const result = await createCaller().setBookStatus({
      bookId: "book-1",
      status: ReadingStatus.WANT_TO_READ,
    });

    expect(prismaMock.prisma.userBook.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        bookId: "book-1",
        status: null,
        wantsToRead: false,
      },
      select: { id: true, wantsToRead: true, status: true },
    });
    expect(result).toEqual({
      status: ReadingStatus.WANT_TO_READ,
      requiresConfirmation: false,
      warning: null,
    });
  });

  test("setBookStatus resumes the same read-through when PAUSED -> READING", async () => {
    prismaMock.prisma.book.findUniqueOrThrow.mockResolvedValue({
      type: BookType.PHYSICAL,
      pageCount: 320,
      audioSeconds: null,
    });
    prismaMock.prisma.userBook.findUnique.mockResolvedValue({
      id: "user-book-1",
      wantsToRead: false,
      status: ReadingStatus.PAUSED,
    });
    prismaMock.prisma.readThrough.findFirst
      .mockResolvedValueOnce({
        id: "read-through-1",
        status: ReadThroughStatus.PAUSED,
        progress: 50,
      })
      .mockResolvedValueOnce({
        id: "read-through-1",
        status: ReadThroughStatus.READING,
        progress: 50,
      });
    prismaMock.prisma.readThrough.update.mockResolvedValue({});
    prismaMock.prisma.userBook.update.mockResolvedValueOnce({
      status: ReadingStatus.READING,
    });

    const result = await createCaller().setBookStatus({
      bookId: "book-1",
      status: ReadingStatus.READING,
    });

    expect(prismaMock.prisma.readThrough.update).toHaveBeenCalledWith({
      where: { id: "read-through-1" },
      data: {
        status: ReadThroughStatus.READING,
        stoppedAt: null,
      },
    });
    expect(result).toEqual({
      status: ReadingStatus.READING,
      requiresConfirmation: false,
      warning: null,
    });
  });

  test("setBookStatus switches COMPLETED to WANT_TO_READ without creating a new read-through", async () => {
    prismaMock.prisma.book.findUniqueOrThrow.mockResolvedValue({
      type: BookType.EBOOK,
      pageCount: 200,
      audioSeconds: null,
    });
    prismaMock.prisma.userBook.findUnique.mockResolvedValue({
      id: "user-book-1",
      wantsToRead: false,
      status: ReadingStatus.COMPLETED,
    });
    prismaMock.prisma.readThrough.findFirst.mockResolvedValue({
      id: "read-through-1",
      status: ReadThroughStatus.COMPLETED,
      progress: 200,
    });
    prismaMock.prisma.userBook.update.mockResolvedValue({
      status: ReadingStatus.WANT_TO_READ,
    });

    const result = await createCaller().setBookStatus({
      bookId: "book-1",
      status: ReadingStatus.WANT_TO_READ,
    });

    expect(prismaMock.prisma.readThrough.create).not.toHaveBeenCalled();
    expect(prismaMock.prisma.readThrough.update).not.toHaveBeenCalled();
    expect(prismaMock.prisma.userBook.update).toHaveBeenCalledWith({
      where: { id: "user-book-1" },
      data: {
        wantsToRead: true,
        status: ReadingStatus.WANT_TO_READ,
      },
      select: { status: true },
    });
    expect(result).toEqual({
      status: ReadingStatus.WANT_TO_READ,
      requiresConfirmation: false,
      warning: null,
    });
  });

  test("setReadingProgress clamps progress and creates a completed read-through", async () => {
    prismaMock.prisma.book.findUniqueOrThrow.mockResolvedValue({
      type: BookType.PHYSICAL,
      pageCount: 320,
      audioSeconds: null,
    });
    prismaMock.prisma.userBook.findUnique.mockResolvedValue(null);
    prismaMock.prisma.userBook.create.mockResolvedValue({
      id: "user-book-1",
      wantsToRead: false,
      status: null,
    });
    prismaMock.prisma.readThrough.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: "read-through-1",
      status: ReadThroughStatus.COMPLETED,
      progress: 320,
    });
    prismaMock.prisma.readThrough.create.mockResolvedValue({});
    prismaMock.prisma.userBook.update.mockResolvedValueOnce({
      status: ReadingStatus.COMPLETED,
    });

    const result = await createCaller().setReadingProgress({
      bookId: "book-1",
      progress: 999,
    });

    expect(prismaMock.prisma.readThrough.create).toHaveBeenCalledWith({
      data: {
        userBookId: "user-book-1",
        progress: 320,
        status: ReadThroughStatus.COMPLETED,
        stoppedAt: expect.any(Date),
      },
    });
    expect(result).toEqual({
      progress: 320,
      status: ReadingStatus.COMPLETED,
      autoCompleted: true,
      progressType: ProgressType.PAGES,
      maxProgress: 320,
    });
  });

  test("setReadingProgress on paused read-through resumes READING", async () => {
    prismaMock.prisma.book.findUniqueOrThrow.mockResolvedValue({
      type: BookType.AUDIOBOOK,
      pageCount: null,
      audioSeconds: 6000,
    });
    prismaMock.prisma.userBook.findUnique.mockResolvedValue({
      id: "user-book-1",
      wantsToRead: false,
      status: ReadingStatus.PAUSED,
    });
    prismaMock.prisma.readThrough.findFirst
      .mockResolvedValueOnce({
        id: "read-through-1",
        status: ReadThroughStatus.PAUSED,
        progress: 300,
      })
      .mockResolvedValueOnce({
        id: "read-through-1",
        status: ReadThroughStatus.READING,
        progress: 900,
      });
    prismaMock.prisma.readThrough.update.mockResolvedValue({});
    prismaMock.prisma.userBook.update.mockResolvedValueOnce({
      status: ReadingStatus.READING,
    });

    const result = await createCaller().setReadingProgress({
      bookId: "book-1",
      progress: 900,
    });

    expect(prismaMock.prisma.readThrough.update).toHaveBeenCalledWith({
      where: { id: "read-through-1" },
      data: {
        progress: 900,
        status: ReadThroughStatus.READING,
        stoppedAt: null,
      },
    });
    expect(result).toEqual({
      progress: 900,
      status: ReadingStatus.READING,
      autoCompleted: false,
      progressType: ProgressType.TIME,
      maxProgress: 6000,
    });
  });
});
