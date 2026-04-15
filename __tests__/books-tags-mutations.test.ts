import { booksRouter } from "@/lib/trpc/routers/books";
import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

type MockTx = {
  tag: {
    findMany: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
  tagBook: {
    deleteMany: ReturnType<typeof vi.fn>;
    createMany: ReturnType<typeof vi.fn>;
  };
};

const prismaMock = vi.hoisted(() => {
  const tx: MockTx = {
    tag: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    tagBook: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  };

  return {
    tx,
    prisma: {
      userBook: {
        findUnique: vi.fn(),
      },
      tag: {
        findUnique: vi.fn(),
        update: vi.fn(),
        deleteMany: vi.fn(),
      },
      $transaction: vi.fn(async (callback: (tx: MockTx) => Promise<unknown>) => callback(tx)),
    },
  };
});

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
  for (const mock of [
    prismaMock.prisma.userBook.findUnique,
    prismaMock.prisma.tag.findUnique,
    prismaMock.prisma.tag.update,
    prismaMock.prisma.tag.deleteMany,
    prismaMock.prisma.$transaction,
    prismaMock.tx.tag.findMany,
    prismaMock.tx.tag.upsert,
    prismaMock.tx.tag.deleteMany,
    prismaMock.tx.tagBook.deleteMany,
    prismaMock.tx.tagBook.createMany,
  ]) {
    mock.mockReset();
  }

  prismaMock.prisma.$transaction.mockImplementation(async (callback: (tx: MockTx) => Promise<unknown>) =>
    callback(prismaMock.tx),
  );

  prismaMock.tx.tag.deleteMany.mockResolvedValue({ count: 0 });
});

describe("books router tag mutations", () => {
  test("updateTag rejects updates to tags not owned by the user", async () => {
    prismaMock.prisma.tag.findUnique.mockResolvedValue(null);

    await expect(
      createCaller().updateTag({
        tagId: "tag-1",
        name: "Updated",
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "TAG_NOT_FOUND",
    });
  });

  test("setBookTags requires the book to be in the user's library", async () => {
    prismaMock.prisma.userBook.findUnique.mockResolvedValue(null);

    await expect(
      createCaller().setBookTags({
        bookId: "book-1",
        tags: [{ mode: "existing", id: "tag-1" }],
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "BOOK_NOT_IN_LIBRARY",
    });
  });

  test("setBookTags rejects existing tag ids not owned by the current user", async () => {
    prismaMock.prisma.userBook.findUnique.mockResolvedValue({ id: "ub-1" });
    prismaMock.tx.tag.findMany.mockImplementation(async ({ where }: { where: Record<string, unknown> }) => {
      if (where.id) {
        return [{ id: "tag-1" }];
      }

      return [];
    });

    await expect(
      createCaller().setBookTags({
        bookId: "book-1",
        tags: [
          { mode: "existing", id: "tag-1" },
          { mode: "existing", id: "tag-2" },
        ],
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "INVALID_TAGS",
    });
  });

  test("setBookTags creates missing tags, reuses existing names, and cleans orphans", async () => {
    prismaMock.prisma.userBook.findUnique.mockResolvedValue({ id: "ub-1" });

    prismaMock.tx.tag.findMany.mockImplementation(async ({ where }: { where: Record<string, unknown> }) => {
      if (where.id) {
        return [{ id: "tag-1" }];
      }

      return [];
    });

    prismaMock.tx.tag.upsert.mockImplementation(async ({ where }: { where: { userId_name: { name: string } } }) => {
      if (where.userId_name.name === "Favorites") {
        return { id: "tag-existing-favorites" };
      }

      return { id: "tag-new-scifi" };
    });

    prismaMock.tx.tagBook.deleteMany.mockResolvedValue({ count: 1 });
    prismaMock.tx.tagBook.createMany.mockResolvedValue({ count: 3 });

    const result = await createCaller().setBookTags({
      bookId: "book-1",
      tags: [
        { mode: "existing", id: "tag-1" },
        { mode: "existing", id: "tag-1" },
        { mode: "create", name: "Favorites" },
        { mode: "create", name: "favorites" },
        { mode: "create", name: "Sci-Fi" },
      ],
    });

    expect(prismaMock.tx.tag.upsert).toHaveBeenCalledTimes(2);

    expect(prismaMock.tx.tagBook.deleteMany).toHaveBeenCalledWith({ where: { userBookId: "ub-1" } });
    expect(prismaMock.tx.tagBook.createMany).toHaveBeenCalledWith({
      data: [
        { tagId: "tag-1", userBookId: "ub-1" },
        { tagId: "tag-existing-favorites", userBookId: "ub-1" },
        { tagId: "tag-new-scifi", userBookId: "ub-1" },
      ],
    });

    expect(prismaMock.tx.tag.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        entries: { none: {} },
      },
    });

    expect(result).toEqual({ count: 3 });
  });

  test("setBookTags clears all tags and still cleans orphans", async () => {
    prismaMock.prisma.userBook.findUnique.mockResolvedValue({ id: "ub-1" });
    prismaMock.tx.tagBook.deleteMany.mockResolvedValue({ count: 2 });

    const result = await createCaller().setBookTags({
      bookId: "book-1",
      tags: [],
    });

    expect(prismaMock.tx.tagBook.deleteMany).toHaveBeenCalledWith({ where: { userBookId: "ub-1" } });
    expect(prismaMock.tx.tagBook.createMany).not.toHaveBeenCalled();
    expect(prismaMock.tx.tag.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        entries: { none: {} },
      },
    });
    expect(result).toEqual({ count: 0 });
  });

  test("deleteTag returns not found for unknown tag", async () => {
    prismaMock.prisma.tag.deleteMany.mockResolvedValue({ count: 0 });

    try {
      await createCaller().deleteTag({ tagId: "missing" });
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("NOT_FOUND");
      expect((error as TRPCError).message).toBe("TAG_NOT_FOUND");
      return;
    }

    throw new Error("Expected deleteTag to throw");
  });
});
