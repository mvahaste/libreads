import { Prisma } from "@/generated/prisma/client";
import { booksRouter } from "@/lib/trpc/routers/books";
import { beforeEach, describe, expect, test, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  prisma: {
    userBook: {
      delete: vi.fn(),
    },
  },
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

function createKnownRequestError(code: string): Prisma.PrismaClientKnownRequestError {
  const error = Object.create(Prisma.PrismaClientKnownRequestError.prototype) as Prisma.PrismaClientKnownRequestError;

  Object.assign(error, {
    code,
    clientVersion: "test",
    message: `Prisma error ${code}`,
    meta: {},
    name: "PrismaClientKnownRequestError",
  });

  return error;
}

describe("books removeBookFromLibrary mutation", () => {
  beforeEach(() => {
    prismaMock.prisma.userBook.delete.mockReset();
  });

  test("deletes user library entry and returns success", async () => {
    prismaMock.prisma.userBook.delete.mockResolvedValue({});

    const result = await createCaller().removeBookFromLibrary({
      bookId: "book-1",
    });

    expect(prismaMock.prisma.userBook.delete).toHaveBeenCalledWith({
      where: { userId_bookId: { userId: "user-1", bookId: "book-1" } },
    });
    expect(result).toEqual({ success: true });
  });

  test("maps prisma P2025 to BOOK_NOT_IN_LIBRARY", async () => {
    prismaMock.prisma.userBook.delete.mockRejectedValue(createKnownRequestError("P2025"));

    await expect(
      createCaller().removeBookFromLibrary({
        bookId: "book-1",
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "BOOK_NOT_IN_LIBRARY",
    });
  });
});
