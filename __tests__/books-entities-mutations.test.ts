import { booksRouter } from "@/lib/trpc/routers/books";
import { beforeEach, describe, expect, test, vi } from "vitest";

type ModelMock = {
  findUnique: ReturnType<typeof vi.fn>;
  findFirst: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  deleteMany: ReturnType<typeof vi.fn>;
};

const prismaMock = vi.hoisted(() => {
  const author: ModelMock = {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  };

  const series: ModelMock = {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  };

  const genre: ModelMock = {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  };

  const publisher: ModelMock = {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  };

  return {
    prisma: {
      author,
      series,
      genre,
      publisher,
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

beforeEach(() => {
  for (const mock of [
    prismaMock.prisma.author.findUnique,
    prismaMock.prisma.author.findFirst,
    prismaMock.prisma.author.update,
    prismaMock.prisma.author.deleteMany,
    prismaMock.prisma.series.findUnique,
    prismaMock.prisma.series.findFirst,
    prismaMock.prisma.series.update,
    prismaMock.prisma.series.deleteMany,
    prismaMock.prisma.genre.findUnique,
    prismaMock.prisma.genre.findFirst,
    prismaMock.prisma.genre.update,
    prismaMock.prisma.genre.deleteMany,
    prismaMock.prisma.publisher.findUnique,
    prismaMock.prisma.publisher.findFirst,
    prismaMock.prisma.publisher.update,
    prismaMock.prisma.publisher.deleteMany,
  ]) {
    mock.mockReset();
  }

  prismaMock.prisma.author.findUnique.mockResolvedValue({ id: "author-1" });
  prismaMock.prisma.author.findFirst.mockResolvedValue(null);
  prismaMock.prisma.author.update.mockResolvedValue({ id: "author-1", name: "New Author", slug: "new-author" });
  prismaMock.prisma.author.deleteMany.mockResolvedValue({ count: 1 });

  prismaMock.prisma.series.findUnique.mockResolvedValue({ id: "series-1" });
  prismaMock.prisma.series.findFirst.mockResolvedValue(null);
  prismaMock.prisma.series.update.mockResolvedValue({ id: "series-1", name: "New Series", slug: "new-series" });
  prismaMock.prisma.series.deleteMany.mockResolvedValue({ count: 1 });

  prismaMock.prisma.genre.findUnique.mockResolvedValue({ id: "genre-1" });
  prismaMock.prisma.genre.findFirst.mockResolvedValue(null);
  prismaMock.prisma.genre.update.mockResolvedValue({ id: "genre-1", name: "New Genre", slug: "new-genre" });
  prismaMock.prisma.genre.deleteMany.mockResolvedValue({ count: 1 });

  prismaMock.prisma.publisher.findUnique.mockResolvedValue({ id: "publisher-1" });
  prismaMock.prisma.publisher.findFirst.mockResolvedValue(null);
  prismaMock.prisma.publisher.update.mockResolvedValue({
    id: "publisher-1",
    name: "New Publisher",
    slug: "new-publisher",
  });
  prismaMock.prisma.publisher.deleteMany.mockResolvedValue({ count: 1 });
});

describe("books router entity mutations", () => {
  test("requires admin privileges", async () => {
    await expect(
      createCaller(false).updateAuthor({
        authorId: "author-1",
        name: "Updated Author",
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "FORBIDDEN",
    });
  });

  test("updateAuthor returns not found when author does not exist", async () => {
    prismaMock.prisma.author.findUnique.mockResolvedValue(null);

    await expect(
      createCaller(true).updateAuthor({
        authorId: "missing-author",
        name: "Updated Author",
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "AUTHOR_NOT_FOUND",
    });
  });

  test("updateAuthor blocks duplicate names", async () => {
    prismaMock.prisma.author.findFirst.mockImplementation(async ({ where }: { where: Record<string, unknown> }) => {
      if (typeof where.name === "object") {
        return null;
      }

      if (typeof where.name === "string") {
        return { id: "author-2" };
      }

      return null;
    });

    await expect(
      createCaller(true).updateAuthor({
        authorId: "author-1",
        name: "Existing Author",
      }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "AUTHOR_ALREADY_EXISTS",
    });

    expect(prismaMock.prisma.author.update).not.toHaveBeenCalled();
  });

  test("updateAuthor regenerates slug when candidate is already in use", async () => {
    prismaMock.prisma.author.findFirst.mockImplementation(async ({ where }: { where: Record<string, unknown> }) => {
      if (typeof where.name === "string") {
        return null;
      }

      if (where.slug === "new-author") {
        return { id: "author-2" };
      }

      return null;
    });

    prismaMock.prisma.author.update.mockResolvedValue({
      id: "author-1",
      name: "New Author",
      slug: "new-author-1",
    });

    const result = await createCaller(true).updateAuthor({
      authorId: "author-1",
      name: "New Author",
    });

    expect(prismaMock.prisma.author.update).toHaveBeenCalledWith({
      where: { id: "author-1" },
      data: {
        name: "New Author",
        slug: "new-author-1",
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    expect(result).toEqual({
      id: "author-1",
      name: "New Author",
      slug: "new-author-1",
    });
  });

  test("updateSeries updates name and slug", async () => {
    const result = await createCaller(true).updateSeries({
      seriesId: "series-1",
      name: "New Series",
    });

    expect(prismaMock.prisma.series.update).toHaveBeenCalledWith({
      where: { id: "series-1" },
      data: {
        name: "New Series",
        slug: "new-series",
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    expect(result).toEqual({ id: "series-1", name: "New Series", slug: "new-series" });
  });

  test("updateGenre returns not found when genre does not exist", async () => {
    prismaMock.prisma.genre.findUnique.mockResolvedValue(null);

    await expect(
      createCaller(true).updateGenre({
        genreId: "missing-genre",
        name: "Updated Genre",
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "GENRE_NOT_FOUND",
    });
  });

  test("updatePublisher updates name and slug", async () => {
    const result = await createCaller(true).updatePublisher({
      publisherId: "publisher-1",
      name: "New Publisher",
    });

    expect(prismaMock.prisma.publisher.update).toHaveBeenCalledWith({
      where: { id: "publisher-1" },
      data: {
        name: "New Publisher",
        slug: "new-publisher",
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    expect(result).toEqual({ id: "publisher-1", name: "New Publisher", slug: "new-publisher" });
  });

  test("deleteAuthor returns not found when author does not exist", async () => {
    prismaMock.prisma.author.deleteMany.mockResolvedValue({ count: 0 });

    await expect(
      createCaller(true).deleteAuthor({
        authorId: "missing-author",
      }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "AUTHOR_NOT_FOUND",
    });
  });

  test("delete entity procedures return success", async () => {
    const caller = createCaller(true);

    await expect(caller.deleteAuthor({ authorId: "author-1" })).resolves.toEqual({ success: true });
    await expect(caller.deleteSeries({ seriesId: "series-1" })).resolves.toEqual({ success: true });
    await expect(caller.deleteGenre({ genreId: "genre-1" })).resolves.toEqual({ success: true });
    await expect(caller.deletePublisher({ publisherId: "publisher-1" })).resolves.toEqual({ success: true });

    expect(prismaMock.prisma.author.deleteMany).toHaveBeenCalledWith({ where: { id: "author-1" } });
    expect(prismaMock.prisma.series.deleteMany).toHaveBeenCalledWith({ where: { id: "series-1" } });
    expect(prismaMock.prisma.genre.deleteMany).toHaveBeenCalledWith({ where: { id: "genre-1" } });
    expect(prismaMock.prisma.publisher.deleteMany).toHaveBeenCalledWith({ where: { id: "publisher-1" } });
  });
});
