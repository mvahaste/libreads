import { booksRouter } from "@/lib/trpc/routers/books";
import { beforeEach, describe, expect, test, vi } from "vitest";

const editionDetailsMock = vi.hoisted(() => vi.fn());
const createCallerMock = vi.hoisted(() => vi.fn(() => ({ editionDetails: editionDetailsMock })));

const prismaMock = vi.hoisted(() => ({
  prisma: {
    book: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/trpc/routers/hardcover", () => ({
  hardcoverRouter: {
    createCaller: createCallerMock,
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

describe("books import mutation", () => {
  beforeEach(() => {
    editionDetailsMock.mockReset();
    createCallerMock.mockClear();
    prismaMock.prisma.book.findUnique.mockReset();
    prismaMock.prisma.$transaction.mockReset();
    prismaMock.prisma.book.findUnique.mockResolvedValue(null);
  });

  test("wraps unexpected non-TRPC errors as IMPORT_FAILED", async () => {
    editionDetailsMock.mockRejectedValue(new Error("network failure"));

    await expect(
      createCaller().import({
        editionId: 123,
      }),
    ).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: "IMPORT_FAILED",
    });
  });

  test("preserves expected TRPC not-found when edition is missing", async () => {
    editionDetailsMock.mockResolvedValue(null);

    await expect(
      createCaller().import({
        editionId: 123,
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "EDITION_NOT_FOUND",
    });
  });

  test("preserves duplicate import conflict for existing Hardcover edition", async () => {
    editionDetailsMock.mockResolvedValue({
      id: 123,
      title: "Example Edition",
      authors: [],
      genres: [],
      series: [],
    });
    prismaMock.prisma.book.findUnique.mockResolvedValueOnce({ id: "book-1" });

    await expect(
      createCaller().import({
        editionId: 123,
      }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "BOOK_ALREADY_EXISTS",
    });
  });
});
