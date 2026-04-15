import { ReadThroughStatus, ReadingStatus } from "@/generated/prisma/client";
import { booksRouter } from "@/lib/trpc/routers/books";
import { beforeEach, describe, expect, test, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  prisma: (() => {
    const userBook = {
      update: vi.fn(),
    };
    const readThrough = {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    };

    return {
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

  prismaMock.prisma.readThrough.findUnique.mockReset();
  prismaMock.prisma.readThrough.findFirst.mockReset();
  prismaMock.prisma.readThrough.delete.mockReset();
  prismaMock.prisma.userBook.update.mockReset();
});

describe("books deleteReadThrough mutation", () => {
  test("deletes a closed read-through and recomputes aggregate status", async () => {
    prismaMock.prisma.readThrough.findUnique.mockResolvedValue({
      id: "read-through-1",
      userBookId: "user-book-1",
      status: ReadThroughStatus.ABANDONED,
      userBook: {
        userId: "user-1",
        wantsToRead: false,
      },
    });
    prismaMock.prisma.readThrough.delete.mockResolvedValue({});
    prismaMock.prisma.readThrough.findFirst.mockResolvedValue({
      id: "read-through-2",
      status: ReadThroughStatus.COMPLETED,
      progress: 100,
    });
    prismaMock.prisma.userBook.update.mockResolvedValue({
      status: ReadingStatus.COMPLETED,
    });

    const result = await createCaller().deleteReadThrough({
      readThroughId: "read-through-1",
    });

    expect(prismaMock.prisma.readThrough.delete).toHaveBeenCalledWith({
      where: { id: "read-through-1" },
    });
    expect(result).toEqual({
      success: true,
      status: ReadingStatus.COMPLETED,
    });
  });

  test("blocks deletion of an active read-through", async () => {
    prismaMock.prisma.readThrough.findUnique.mockResolvedValue({
      id: "read-through-1",
      userBookId: "user-book-1",
      status: ReadThroughStatus.READING,
      userBook: {
        userId: "user-1",
        wantsToRead: false,
      },
    });

    await expect(
      createCaller().deleteReadThrough({
        readThroughId: "read-through-1",
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "READ_THROUGH_DELETE_NOT_ALLOWED",
    });

    expect(prismaMock.prisma.readThrough.delete).not.toHaveBeenCalled();
  });

  test("deleting the last read-through keeps no status when want-to-read is not set", async () => {
    prismaMock.prisma.readThrough.findUnique.mockResolvedValue({
      id: "read-through-last",
      userBookId: "user-book-1",
      status: ReadThroughStatus.COMPLETED,
      userBook: {
        userId: "user-1",
        wantsToRead: false,
      },
    });
    prismaMock.prisma.readThrough.delete.mockResolvedValue({});
    prismaMock.prisma.readThrough.findFirst.mockResolvedValue(null);
    prismaMock.prisma.userBook.update.mockResolvedValue({
      status: null,
    });

    const result = await createCaller().deleteReadThrough({
      readThroughId: "read-through-last",
    });

    expect(prismaMock.prisma.userBook.update).toHaveBeenCalledWith({
      where: { id: "user-book-1" },
      data: {
        wantsToRead: false,
        status: null,
      },
      select: { status: true },
    });
    expect(result).toEqual({
      success: true,
      status: null,
    });
  });

  test("deleting the last read-through keeps WANT_TO_READ when intent is set", async () => {
    prismaMock.prisma.readThrough.findUnique.mockResolvedValue({
      id: "read-through-last",
      userBookId: "user-book-1",
      status: ReadThroughStatus.COMPLETED,
      userBook: {
        userId: "user-1",
        wantsToRead: true,
      },
    });
    prismaMock.prisma.readThrough.delete.mockResolvedValue({});
    prismaMock.prisma.readThrough.findFirst.mockResolvedValue(null);
    prismaMock.prisma.userBook.update.mockResolvedValue({
      status: ReadingStatus.WANT_TO_READ,
    });

    const result = await createCaller().deleteReadThrough({
      readThroughId: "read-through-last",
    });

    expect(prismaMock.prisma.userBook.update).toHaveBeenCalledWith({
      where: { id: "user-book-1" },
      data: {
        wantsToRead: true,
        status: ReadingStatus.WANT_TO_READ,
      },
      select: { status: true },
    });
    expect(result).toEqual({
      success: true,
      status: ReadingStatus.WANT_TO_READ,
    });
  });

  test("returns not found when read-through is not owned by user", async () => {
    prismaMock.prisma.readThrough.findUnique.mockResolvedValue({
      id: "read-through-1",
      userBookId: "user-book-1",
      status: ReadThroughStatus.COMPLETED,
      userBook: {
        userId: "other-user",
        wantsToRead: false,
      },
    });

    await expect(
      createCaller().deleteReadThrough({
        readThroughId: "read-through-1",
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "READ_THROUGH_NOT_FOUND",
    });
  });
});
