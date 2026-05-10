import { booksRouter } from "@/lib/trpc/routers/books";
import { beforeEach, describe, expect, test, vi } from "vitest";

const tx = {
  book: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  image: { findUnique: vi.fn(), deleteMany: vi.fn() },
  bookAuthor: { deleteMany: vi.fn(), createMany: vi.fn() },
  bookGenre: { deleteMany: vi.fn(), createMany: vi.fn() },
  bookSeries: { deleteMany: vi.fn(), createMany: vi.fn() },
  publisher: { findUnique: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
  author: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
  genre: { findUnique: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
  series: { findUnique: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
};

const { prisma } = vi.hoisted(() => ({
  prisma: {
    $transaction: vi.fn(),
    book: { findUnique: vi.fn(), findFirst: vi.fn() },
    author: { findMany: vi.fn() },
    genre: { findMany: vi.fn() },
    publisher: { findMany: vi.fn() },
    series: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma }));

function createCaller(isAdmin: boolean) {
  return booksRouter.createCaller({
    headers: new Headers(),
    session: isAdmin
      ? { user: { id: "user-1", isAdmin: true } }
      : { user: { id: "user-1", isAdmin: false } },
  } as never);
}

function createAnonymousCaller() {
  return booksRouter.createCaller({ headers: new Headers(), session: null });
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

const createInput = {
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
  vi.clearAllMocks();

  prisma.$transaction.mockImplementation((cb: (t: typeof tx) => Promise<unknown>) => cb(tx));
  prisma.book.findUnique.mockResolvedValue(null);
  prisma.book.findFirst.mockResolvedValue(null);
  prisma.author.findMany.mockResolvedValue([]);
  prisma.genre.findMany.mockResolvedValue([]);
  prisma.publisher.findMany.mockResolvedValue([]);
  prisma.series.findMany.mockResolvedValue([]);

  tx.book.findUnique.mockResolvedValue({
    id: "book-1",
    publisherId: null,
    coverId: null,
    authors: [],
    genres: [],
    series: [],
  });
  tx.book.findFirst.mockResolvedValue(null);
  tx.book.update.mockResolvedValue({ id: "book-1", slug: "new-title" });
  tx.book.create.mockResolvedValue({ id: "created", slug: "created-book" });
  tx.book.delete.mockResolvedValue({ id: "book-1" });
  tx.image.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => ({ id: where.id }));
  tx.publisher.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => ({ id: where.id }));
  tx.author.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => ({ id: where.id }));
  tx.genre.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => ({ id: where.id }));
  tx.series.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => ({ id: where.id }));
});

describe("updateBook", () => {
  test("requires admin", async () => {
    await expect(createCaller(false).updateBook(baseInput)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  test("updates fields and appends suffix on slug collision", async () => {
    tx.book.findFirst.mockResolvedValueOnce({ id: "book-2" });

    const result = await createCaller(true).updateBook({
      ...baseInput,
      publishYear: 2024,
      pageCount: 320,
      isbn10: "0306406152",
      isbn13: "9780306406157",
      format: "Paperback",
    });

    expect(tx.book.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: "new-title-1",
          publishYear: 2024,
          pageCount: 320,
          isbn10: "0306406152",
          isbn13: "9780306406157",
        }),
      }),
    );
    expect(result).toEqual({ id: "book-1", slug: "new-title" });
  });

  test("replaces relations and cleans up orphaned entities", async () => {
    tx.book.findUnique.mockResolvedValue({
      id: "book-1",
      publisherId: "pub-old",
      coverId: null,
      authors: [{ authorId: "auth-old" }],
      genres: [{ genreId: "genre-old" }],
      series: [{ seriesId: "series-old" }],
    });

    await createCaller(true).updateBook({
      ...baseInput,
      publisher: { mode: "existing", id: "pub-1" },
      authors: [
        { mode: "existing", id: "auth-1" },
        { mode: "existing", id: "auth-2" },
      ],
      genres: [{ mode: "existing", id: "genre-1" }],
      series: [{ series: { mode: "existing", id: "series-1" }, position: 1 }],
    });

    expect(tx.bookAuthor.deleteMany).toHaveBeenCalledWith({ where: { bookId: "book-1" } });
    expect(tx.bookAuthor.createMany).toHaveBeenCalledWith({
      data: [
        { bookId: "book-1", authorId: "auth-1" },
        { bookId: "book-1", authorId: "auth-2" },
      ],
    });
    expect(tx.bookGenre.deleteMany).toHaveBeenCalledWith({ where: { bookId: "book-1" } });
    expect(tx.bookSeries.deleteMany).toHaveBeenCalledWith({ where: { bookId: "book-1" } });
    expect(tx.publisher.deleteMany).toHaveBeenCalledWith({
      where: { id: "pub-old", books: { none: {} } },
    });
    expect(tx.author.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["auth-old"] }, books: { none: {} } },
    });
  });

  test("cleans up detached cover when cover is replaced", async () => {
    tx.book.findUnique.mockResolvedValue({
      id: "book-1",
      publisherId: null,
      coverId: "cover-old",
      authors: [],
      genres: [],
      series: [],
    });

    await createCaller(true).updateBook({ ...baseInput, coverId: "cover-new" });

    expect(tx.image.deleteMany).toHaveBeenCalledWith({
      where: { id: "cover-old", books: { none: {} }, users: { none: {} } },
    });
  });
});

describe("createBook", () => {
  test("any authenticated user can create a book", async () => {
    const result = await createCaller(false).createBook(createInput);

    expect(tx.book.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: "Created Book" }),
      }),
    );
    expect(result).toEqual({ id: "created", slug: "created-book" });
  });
});

describe("deleteBook", () => {
  test("requires admin", async () => {
    await expect(createAnonymousCaller().deleteBook({ bookId: "book-1" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });

    await expect(createCaller(false).deleteBook({ bookId: "book-1" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  test("throws NOT_FOUND when book does not exist", async () => {
    prisma.book.findUnique.mockResolvedValue(null);

    await expect(createCaller(true).deleteBook({ bookId: "nonexistent" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  test("cleans up orphaned entities on delete", async () => {
    prisma.book.findUnique.mockResolvedValue({
      id: "book-1",
      publisherId: "pub-1",
      coverId: "cover-1",
      authors: [{ authorId: "auth-1" }],
      genres: [{ genreId: "genre-1" }],
      series: [{ seriesId: "series-1" }],
    });

    const result = await createCaller(true).deleteBook({ bookId: "book-1" });

    expect(result).toEqual({ success: true });
    expect(tx.book.delete).toHaveBeenCalledWith({ where: { id: "book-1" } });
    expect(tx.author.deleteMany).toHaveBeenCalled();
    expect(tx.genre.deleteMany).toHaveBeenCalled();
    expect(tx.series.deleteMany).toHaveBeenCalled();
    expect(tx.publisher.deleteMany).toHaveBeenCalled();
    expect(tx.image.deleteMany).toHaveBeenCalled();
  });
});
