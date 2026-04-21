import { booksRouter } from "@/lib/trpc/routers/books";
import { beforeEach, describe, expect, test, vi } from "vitest";

type MockTx = {
  book: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  image: {
    findUnique: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
  bookAuthor: {
    deleteMany: ReturnType<typeof vi.fn>;
    createMany: ReturnType<typeof vi.fn>;
  };
  bookGenre: {
    deleteMany: ReturnType<typeof vi.fn>;
    createMany: ReturnType<typeof vi.fn>;
  };
  bookSeries: {
    deleteMany: ReturnType<typeof vi.fn>;
    createMany: ReturnType<typeof vi.fn>;
  };
  publisher: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
  author: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
  genre: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
  series: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
};

const prismaMock = vi.hoisted(() => {
  const tx: MockTx = {
    book: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    image: {
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
    },
    bookAuthor: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    bookGenre: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    bookSeries: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    publisher: {
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    author: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    genre: {
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    series: {
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  };

  return {
    tx,
    prisma: {
      $transaction: vi.fn(async (callback: (tx: MockTx) => Promise<unknown>) => callback(tx)),
      book: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
      author: {
        findMany: vi.fn(),
      },
      genre: {
        findMany: vi.fn(),
      },
      publisher: {
        findMany: vi.fn(),
      },
      series: {
        findMany: vi.fn(),
      },
    },
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock.prisma,
}));

function createCaller(isAdmin: boolean) {
  return booksRouter.createCaller({
    headers: new Headers(),
    session: {
      user: {
        id: "user-1",
        isAdmin,
      },
    } as never,
  });
}

function createAnonymousCaller() {
  return booksRouter.createCaller({
    headers: new Headers(),
    session: null,
  });
}

const baseInput = {
  bookId: "book-1",
  title: "New Title",
  subtitle: null,
  description: null,
  publishYear: null,
  type: "PHYSICAL" as const,
  format: null,
  pageCount: null,
  audioSeconds: null,
  isbn10: null,
  isbn13: null,
  hardcoverId: null,
};

const baseCreateInput = {
  title: "Created Book",
  subtitle: null,
  description: null,
  publishYear: null,
  type: "PHYSICAL" as const,
  format: null,
  pageCount: null,
  audioSeconds: null,
  isbn10: null,
  isbn13: null,
  hardcoverId: null,
  coverId: null,
  publisher: null,
  authors: [],
  genres: [],
  series: [],
};

beforeEach(() => {
  for (const mock of [
    prismaMock.prisma.$transaction,
    prismaMock.prisma.book.findFirst,
    prismaMock.prisma.book.findUnique,
    prismaMock.tx.book.findUnique,
    prismaMock.tx.book.findFirst,
    prismaMock.tx.book.create,
    prismaMock.tx.book.update,
    prismaMock.tx.book.delete,
    prismaMock.prisma.author.findMany,
    prismaMock.prisma.genre.findMany,
    prismaMock.prisma.publisher.findMany,
    prismaMock.prisma.series.findMany,
    prismaMock.tx.image.findUnique,
    prismaMock.tx.image.deleteMany,
    prismaMock.tx.bookAuthor.deleteMany,
    prismaMock.tx.bookAuthor.createMany,
    prismaMock.tx.bookGenre.deleteMany,
    prismaMock.tx.bookGenre.createMany,
    prismaMock.tx.bookSeries.deleteMany,
    prismaMock.tx.bookSeries.createMany,
    prismaMock.tx.publisher.findUnique,
    prismaMock.tx.publisher.create,
    prismaMock.tx.publisher.deleteMany,
    prismaMock.tx.author.findUnique,
    prismaMock.tx.author.findFirst,
    prismaMock.tx.author.create,
    prismaMock.tx.author.deleteMany,
    prismaMock.tx.genre.findUnique,
    prismaMock.tx.genre.create,
    prismaMock.tx.genre.deleteMany,
    prismaMock.tx.series.findUnique,
    prismaMock.tx.series.create,
    prismaMock.tx.series.deleteMany,
  ]) {
    mock.mockReset();
  }

  prismaMock.prisma.$transaction.mockImplementation(async (callback: (tx: MockTx) => Promise<unknown>) =>
    callback(prismaMock.tx),
  );

  prismaMock.prisma.book.findFirst.mockResolvedValue(null);
  prismaMock.prisma.book.findUnique.mockResolvedValue(null);
  prismaMock.tx.book.findFirst.mockResolvedValue(null);
  prismaMock.tx.book.delete.mockResolvedValue({ id: "book-1" });

  prismaMock.tx.book.findUnique.mockResolvedValue({
    id: "book-1",
    publisherId: null,
    coverId: null,
    authors: [],
    genres: [],
    series: [],
  });
  prismaMock.tx.image.deleteMany.mockResolvedValue({ count: 1 });
  prismaMock.tx.book.create.mockResolvedValue({ id: "book-created", slug: "created-book" });
  prismaMock.tx.book.update.mockResolvedValue({ id: "book-1", slug: "new-title" });
  prismaMock.tx.image.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => ({
    id: where.id,
  }));
  prismaMock.tx.publisher.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => ({
    id: where.id,
  }));
  prismaMock.tx.author.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => ({
    id: where.id,
  }));
  prismaMock.tx.genre.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => ({
    id: where.id,
  }));
  prismaMock.tx.series.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => ({
    id: where.id,
  }));
  prismaMock.prisma.author.findMany.mockResolvedValue([]);
  prismaMock.prisma.genre.findMany.mockResolvedValue([]);
  prismaMock.prisma.publisher.findMany.mockResolvedValue([]);
  prismaMock.prisma.series.findMany.mockResolvedValue([]);
});

describe("books router updateBook mutation", () => {
  test("requires admin privileges", async () => {
    await expect(createCaller(false).updateBook(baseInput)).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "FORBIDDEN",
    });
  });

  test("updates scalar book fields for admins", async () => {
    const result = await createCaller(true).updateBook({
      ...baseInput,
      subtitle: "",
      description: "",
      publishYear: 2024,
      format: "Paperback",
      pageCount: 320,
      isbn10: "0306406152",
      isbn13: "9780306406157",
      hardcoverId: 123,
    });

    expect(prismaMock.tx.book.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "book-1" },
        data: expect.objectContaining({
          title: "New Title",
          slug: "new-title",
          subtitle: null,
          description: null,
          publishYear: 2024,
          type: "PHYSICAL",
          format: "Paperback",
          pageCount: 320,
          isbn10: "0306406152",
          isbn13: "9780306406157",
          hardcoverId: 123,
        }),
      }),
    );

    expect(result).toEqual({ id: "book-1", slug: "new-title" });
  });

  test("rejects invalid ISBN payload for update", async () => {
    await expect(
      createCaller(true).updateBook({
        ...baseInput,
        isbn10: "0306406153",
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });

    expect(prismaMock.prisma.$transaction).not.toHaveBeenCalled();
    expect(prismaMock.tx.book.update).not.toHaveBeenCalled();
  });

  test("appends suffix when regenerated slug collides on update", async () => {
    prismaMock.tx.book.findFirst.mockImplementation(async ({ where }: { where: Record<string, unknown> }) => {
      if (where.slug === "new-title") {
        return { id: "book-2" };
      }

      return null;
    });

    await createCaller(true).updateBook(baseInput);

    expect(prismaMock.tx.book.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: "new-title-1",
        }),
      }),
    );
  });

  test("rejects missing cover image references", async () => {
    prismaMock.tx.image.findUnique.mockResolvedValue(null);

    await expect(
      createCaller(true).updateBook({
        ...baseInput,
        coverId: "missing-cover",
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "COVER_NOT_FOUND",
    });
  });

  test("replaces relation joins for admins", async () => {
    prismaMock.tx.book.findUnique.mockResolvedValue({
      id: "book-1",
      publisherId: "publisher-legacy",
      coverId: null,
      authors: [{ authorId: "author-legacy" }],
      genres: [{ genreId: "genre-legacy" }],
      series: [{ seriesId: "series-legacy" }],
    });

    await createCaller(true).updateBook({
      ...baseInput,
      publisher: { mode: "existing", id: "publisher-1" },
      authors: [
        { mode: "existing", id: "author-1" },
        { mode: "existing", id: "author-2" },
      ],
      genres: [
        { mode: "existing", id: "genre-1" },
        { mode: "existing", id: "genre-2" },
      ],
      series: [
        { series: { mode: "existing", id: "series-1" }, position: 1 },
        { series: { mode: "existing", id: "series-2" }, position: 2.5 },
      ],
    });

    expect(prismaMock.tx.bookAuthor.deleteMany).toHaveBeenCalledWith({ where: { bookId: "book-1" } });
    expect(prismaMock.tx.bookAuthor.createMany).toHaveBeenCalledWith({
      data: [
        { bookId: "book-1", authorId: "author-1" },
        { bookId: "book-1", authorId: "author-2" },
      ],
    });

    expect(prismaMock.tx.bookGenre.deleteMany).toHaveBeenCalledWith({ where: { bookId: "book-1" } });
    expect(prismaMock.tx.bookGenre.createMany).toHaveBeenCalledWith({
      data: [
        { bookId: "book-1", genreId: "genre-1" },
        { bookId: "book-1", genreId: "genre-2" },
      ],
    });

    expect(prismaMock.tx.bookSeries.deleteMany).toHaveBeenCalledWith({ where: { bookId: "book-1" } });
    expect(prismaMock.tx.bookSeries.createMany).toHaveBeenCalledWith({
      data: [
        { bookId: "book-1", seriesId: "series-1", position: 1 },
        { bookId: "book-1", seriesId: "series-2", position: 2.5 },
      ],
    });

    expect(prismaMock.tx.publisher.deleteMany).toHaveBeenCalledWith({
      where: {
        id: "publisher-legacy",
        books: { none: {} },
      },
    });
    expect(prismaMock.tx.author.deleteMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["author-legacy"] },
        books: { none: {} },
      },
    });
    expect(prismaMock.tx.genre.deleteMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["genre-legacy"] },
        books: { none: {} },
      },
    });
    expect(prismaMock.tx.series.deleteMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["series-legacy"] },
        books: { none: {} },
      },
    });
  });

  test("rejects duplicate series entries after resolving refs", async () => {
    await expect(
      createCaller(true).updateBook({
        ...baseInput,
        series: [
          { series: { mode: "existing", id: "series-1" }, position: 1 },
          { series: { mode: "existing", id: "series-1" }, position: 2 },
        ],
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "DUPLICATE_SERIES_ENTRY",
    });

    expect(prismaMock.tx.bookSeries.createMany).not.toHaveBeenCalled();
  });

  test("only cleans detached relations from this edit", async () => {
    prismaMock.tx.book.findUnique.mockResolvedValue({
      id: "book-1",
      publisherId: "publisher-same",
      coverId: null,
      authors: [{ authorId: "author-keep" }, { authorId: "author-drop" }],
      genres: [{ genreId: "genre-keep" }, { genreId: "genre-drop" }],
      series: [{ seriesId: "series-keep" }, { seriesId: "series-drop" }],
    });

    await createCaller(true).updateBook({
      ...baseInput,
      publisher: { mode: "existing", id: "publisher-same" },
      authors: [{ mode: "existing", id: "author-keep" }],
      genres: [{ mode: "existing", id: "genre-keep" }],
      series: [{ series: { mode: "existing", id: "series-keep" }, position: 1 }],
    });

    expect(prismaMock.tx.publisher.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.tx.author.deleteMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.tx.author.deleteMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["author-drop"] },
        books: { none: {} },
      },
    });
    expect(prismaMock.tx.genre.deleteMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.tx.genre.deleteMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["genre-drop"] },
        books: { none: {} },
      },
    });
    expect(prismaMock.tx.series.deleteMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.tx.series.deleteMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["series-drop"] },
        books: { none: {} },
      },
    });
  });

  test("does not run orphan cleanup for untouched relations", async () => {
    prismaMock.tx.book.findUnique.mockResolvedValue({
      id: "book-1",
      publisherId: "publisher-1",
      coverId: null,
      authors: [{ authorId: "author-1" }],
      genres: [{ genreId: "genre-1" }],
      series: [{ seriesId: "series-1" }],
    });

    await createCaller(true).updateBook(baseInput);

    expect(prismaMock.tx.publisher.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.tx.image.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.tx.author.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.tx.genre.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.tx.series.deleteMany).not.toHaveBeenCalled();
  });

  test("cleans up detached previous cover when cover is replaced", async () => {
    prismaMock.tx.book.findUnique.mockResolvedValue({
      id: "book-1",
      publisherId: null,
      coverId: "cover-old",
      authors: [],
      genres: [],
      series: [],
    });

    await createCaller(true).updateBook({
      ...baseInput,
      coverId: "cover-new",
    });

    expect(prismaMock.tx.image.deleteMany).toHaveBeenCalledWith({
      where: {
        id: "cover-old",
        books: { none: {} },
        users: { none: {} },
      },
    });
  });

  test("cleans up detached previous cover when cover is cleared", async () => {
    prismaMock.tx.book.findUnique.mockResolvedValue({
      id: "book-1",
      publisherId: null,
      coverId: "cover-old",
      authors: [],
      genres: [],
      series: [],
    });

    await createCaller(true).updateBook({
      ...baseInput,
      coverId: null,
    });

    expect(prismaMock.tx.image.deleteMany).toHaveBeenCalledWith({
      where: {
        id: "cover-old",
        books: { none: {} },
        users: { none: {} },
      },
    });
  });

  test("does not clean cover when cover id is unchanged", async () => {
    prismaMock.tx.book.findUnique.mockResolvedValue({
      id: "book-1",
      publisherId: null,
      coverId: "cover-same",
      authors: [],
      genres: [],
      series: [],
    });

    await createCaller(true).updateBook({
      ...baseInput,
      coverId: "cover-same",
    });

    expect(prismaMock.tx.image.deleteMany).not.toHaveBeenCalled();
  });
});

describe("books router bookEditConflicts query", () => {
  test("requires admin privileges", async () => {
    await expect(
      createCaller(false).bookEditConflicts({
        bookId: "book-1",
        hardcoverId: 42,
        isbn10: "0306406152",
        isbn13: "9780306406157",
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "FORBIDDEN",
    });
  });

  test("returns conflict flags and excludes current book id", async () => {
    prismaMock.prisma.book.findFirst.mockImplementation(async ({ where }: { where: Record<string, unknown> }) => {
      if (where.hardcoverId === 777) {
        return { id: "book-3" };
      }

      if (where.isbn10 === "taken-isbn10") {
        return { id: "book-4" };
      }

      if (where.isbn13 === "taken-isbn13") {
        return { id: "book-5" };
      }

      return null;
    });

    const result = await createCaller(true).bookEditConflicts({
      bookId: "book-1",
      hardcoverId: 777,
      isbn10: "taken-isbn10",
      isbn13: "taken-isbn13",
    });

    expect(result).toEqual({
      hardcoverId: true,
      isbn10: true,
      isbn13: true,
    });

    expect(prismaMock.prisma.book.findFirst).toHaveBeenCalledTimes(3);

    for (const [args] of prismaMock.prisma.book.findFirst.mock.calls) {
      expect(args.where.id).toEqual({ not: "book-1" });
    }
  });

  test("skips database checks for null unique fields", async () => {
    const result = await createCaller(true).bookEditConflicts({
      bookId: "book-1",
      hardcoverId: null,
      isbn10: null,
      isbn13: null,
    });

    expect(result).toEqual({
      hardcoverId: false,
      isbn10: false,
      isbn13: false,
    });

    expect(prismaMock.prisma.book.findFirst).not.toHaveBeenCalled();
  });
});

describe("books router createBook mutation", () => {
  test("requires authenticated user", async () => {
    await expect(createAnonymousCaller().createBook(baseCreateInput)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "UNAUTHORIZED",
    });
  });

  test("allows non-admin users to create books", async () => {
    const result = await createCaller(false).createBook(baseCreateInput);

    expect(prismaMock.tx.book.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Created Book",
          slug: "created-book",
        }),
      }),
    );
    expect(result).toEqual({ id: "book-created", slug: "created-book" });
  });

  test("rejects invalid ISBN payload for create", async () => {
    await expect(
      createCaller(false).createBook({
        ...baseCreateInput,
        isbn13: "9780306406158",
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });

    expect(prismaMock.prisma.$transaction).not.toHaveBeenCalled();
    expect(prismaMock.tx.book.create).not.toHaveBeenCalled();
  });

  test("appends suffix when generated slug collides on create", async () => {
    prismaMock.tx.book.findFirst.mockImplementation(async ({ where }: { where: Record<string, unknown> }) => {
      if (where.slug === "created-book") {
        return { id: "book-2" };
      }

      return null;
    });

    await createCaller(false).createBook(baseCreateInput);

    expect(prismaMock.tx.book.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: "created-book-1",
        }),
      }),
    );
  });
});

describe("books router deleteBook mutation", () => {
  test("requires admin privileges", async () => {
    await expect(createCaller(false).deleteBook({ bookId: "book-1" })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "FORBIDDEN",
    });
  });

  test("deletes the book", async () => {
    prismaMock.prisma.book.findUnique.mockResolvedValue({
      id: "book-1",
      coverId: null,
      publisherId: null,
      authors: [],
      genres: [],
      series: [],
    });

    await createCaller(true).deleteBook({ bookId: "book-1" });

    expect(prismaMock.tx.book.delete).toHaveBeenCalledWith({
      where: { id: "book-1" },
    });
  });

  test("throws NOT_FOUND when book does not exist", async () => {
    prismaMock.prisma.book.findUnique.mockResolvedValue(null);

    await expect(createCaller(true).deleteBook({ bookId: "nonexistent" })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "BOOK_NOT_FOUND",
    });

    expect(prismaMock.tx.book.delete).not.toHaveBeenCalled();
  });

  test("cleans up orphaned authors when book is deleted", async () => {
    prismaMock.prisma.book.findUnique.mockResolvedValue({
      id: "book-1",
      coverId: null,
      publisherId: null,
      authors: [{ authorId: "author-1" }],
      genres: [],
      series: [],
    });

    await createCaller(true).deleteBook({ bookId: "book-1" });

    expect(prismaMock.tx.author.deleteMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["author-1"] },
        books: { none: {} },
      },
    });
  });

  test("cleans up orphaned genres when book is deleted", async () => {
    prismaMock.prisma.book.findUnique.mockResolvedValue({
      id: "book-1",
      coverId: null,
      publisherId: null,
      authors: [],
      genres: [{ genreId: "genre-1" }],
      series: [],
    });

    await createCaller(true).deleteBook({ bookId: "book-1" });

    expect(prismaMock.tx.genre.deleteMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["genre-1"] },
        books: { none: {} },
      },
    });
  });

  test("cleans up orphaned series when book is deleted", async () => {
    prismaMock.prisma.book.findUnique.mockResolvedValue({
      id: "book-1",
      coverId: null,
      publisherId: null,
      authors: [],
      genres: [],
      series: [{ seriesId: "series-1" }],
    });

    await createCaller(true).deleteBook({ bookId: "book-1" });

    expect(prismaMock.tx.series.deleteMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["series-1"] },
        books: { none: {} },
      },
    });
  });

  test("cleans up orphaned publisher when book is deleted", async () => {
    prismaMock.prisma.book.findUnique.mockResolvedValue({
      id: "book-1",
      coverId: null,
      publisherId: "publisher-1",
      authors: [],
      genres: [],
      series: [],
    });

    await createCaller(true).deleteBook({ bookId: "book-1" });

    expect(prismaMock.tx.publisher.deleteMany).toHaveBeenCalledWith({
      where: {
        id: "publisher-1",
        books: { none: {} },
      },
    });
  });

  test("cleans up orphaned cover when book is deleted", async () => {
    prismaMock.prisma.book.findUnique.mockResolvedValue({
      id: "book-1",
      coverId: "cover-1",
      publisherId: null,
      authors: [],
      genres: [],
      series: [],
    });

    await createCaller(true).deleteBook({ bookId: "book-1" });

    expect(prismaMock.tx.image.deleteMany).toHaveBeenCalledWith({
      where: {
        id: "cover-1",
        books: { none: {} },
        users: { none: {} },
      },
    });
  });

  test("does not delete entities with remaining books", async () => {
    prismaMock.prisma.book.findUnique.mockResolvedValue({
      id: "book-1",
      coverId: null,
      publisherId: "publisher-share",
      authors: [{ authorId: "author-share" }],
      genres: [{ genreId: "genre-share" }],
      series: [{ seriesId: "series-share" }],
    });

    prismaMock.tx.author.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.tx.genre.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.tx.series.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.tx.publisher.deleteMany.mockResolvedValue({ count: 0 });

    await createCaller(true).deleteBook({ bookId: "book-1" });

    expect(prismaMock.tx.author.deleteMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["author-share"] },
        books: { none: {} },
      },
    });
    expect(prismaMock.tx.genre.deleteMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["genre-share"] },
        books: { none: {} },
      },
    });
    expect(prismaMock.tx.series.deleteMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["series-share"] },
        books: { none: {} },
      },
    });
    expect(prismaMock.tx.publisher.deleteMany).toHaveBeenCalledWith({
      where: {
        id: "publisher-share",
        books: { none: {} },
      },
    });
    expect(prismaMock.tx.image.deleteMany).not.toHaveBeenCalled();
  });
});

describe("books router shared form endpoints", () => {
  test("bookFormOptions is available to non-admin users", async () => {
    prismaMock.prisma.author.findMany.mockResolvedValue([{ id: "author-1", name: "Author 1", slug: "author-1" }]);
    prismaMock.prisma.genre.findMany.mockResolvedValue([{ id: "genre-1", name: "Genre 1", slug: "genre-1" }]);
    prismaMock.prisma.publisher.findMany.mockResolvedValue([
      { id: "publisher-1", name: "Publisher 1", slug: "publisher-1" },
    ]);
    prismaMock.prisma.series.findMany.mockResolvedValue([{ id: "series-1", name: "Series 1", slug: "series-1" }]);

    const result = await createCaller(false).bookFormOptions();

    expect(result).toEqual({
      authors: [{ id: "author-1", name: "Author 1", slug: "author-1" }],
      genres: [{ id: "genre-1", name: "Genre 1", slug: "genre-1" }],
      publishers: [{ id: "publisher-1", name: "Publisher 1", slug: "publisher-1" }],
      series: [{ id: "series-1", name: "Series 1", slug: "series-1" }],
    });
  });

  test("bookFormConflicts checks uniqueness without exclude id", async () => {
    prismaMock.prisma.book.findFirst.mockImplementation(async ({ where }: { where: Record<string, unknown> }) => {
      if (where.isbn10 === "taken-isbn10") {
        return { id: "book-2" };
      }

      return null;
    });

    const result = await createCaller(false).bookFormConflicts({
      hardcoverId: null,
      isbn10: "taken-isbn10",
      isbn13: null,
    });

    expect(result).toEqual({
      hardcoverId: false,
      isbn10: true,
      isbn13: false,
    });
  });
});
