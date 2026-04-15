import { Prisma } from "@/generated/prisma/client";
import { READING_STATUS_VALUES } from "@/lib/books/reading-status";
import { inferProgressType, isReadThroughActive } from "@/lib/books/status-transitions";
import { prisma } from "@/lib/prisma";
import { protectedProcedure } from "@/lib/trpc/init";
import { TRPCError } from "@trpc/server";
import z from "zod/v4";

import { runPaginatedListQuery, withProcedureErrorHandling } from "../../shared";
import { buildBookWhereInput, buildOrderBy, editionSortFields, listInput, readingStatusFilterSchema } from "../shared";

type MappedBookListItem = {
  authors: {
    author: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
  series: {
    series: {
      id: string;
      name: string;
      slug: string;
    };
    position: number | null;
  }[];
};

function mapBookListItem<TBook extends MappedBookListItem>(book: TBook) {
  return {
    ...book,
    authors: book.authors.map((entry) => entry.author),
    series: book.series[0]
      ? {
          id: book.series[0].series.id,
          name: book.series[0].series.name,
          position: book.series[0].position,
        }
      : null,
  };
}

function withBooksQueryError<T>(execute: () => Promise<T>, logLabel: string, internalMessage: string) {
  return withProcedureErrorHandling(execute, {
    logLabel,
    internalMessage,
  });
}

/**
 * Get books with search, filter, sort, and pagination.
 */
export const allBooksProcedure = protectedProcedure
  .input(
    listInput.extend({
      genre: z.string().default(""),
      author: z.string().default(""),
      publisher: z.string().default(""),
      series: z.string().default(""),
      format: z.string().default(""),
    }),
  )
  .query(async ({ input }) =>
    withBooksQueryError(
      async () => {
        const { page, pageSize, search, sort, genre, author, publisher, series, format } = input;

        const where = buildBookWhereInput({
          search,
          genre,
          author,
          publisher,
          series,
          format,
        });

        const orderBy = buildOrderBy(sort, editionSortFields, { title: "asc" as const });

        return runPaginatedListQuery({
          page,
          pageSize,
          findMany: (pagination) =>
            prisma.book.findMany({
              where,
              orderBy,
              ...pagination,
              select: {
                id: true,
                slug: true,
                title: true,
                subtitle: true,
                coverId: true,
                publishYear: true,
                format: true,
                pageCount: true,
                audioSeconds: true,
                publisher: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
                authors: {
                  select: {
                    author: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                      },
                    },
                  },
                },
                series: {
                  take: 1,
                  select: {
                    series: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                      },
                    },
                    position: true,
                  },
                },
              },
            }),
          count: () => prisma.book.count({ where }),
          mapItem: mapBookListItem,
        });
      },
      "Error in allBooks query",
      "FETCH_BOOKS_FAILED",
    ),
  );

/**
 * Get current user's books with search, filter, sort, and pagination.
 */
export const myBooksProcedure = protectedProcedure
  .input(
    listInput.extend({
      genre: z.string().default(""),
      author: z.string().default(""),
      publisher: z.string().default(""),
      series: z.string().default(""),
      format: z.string().default(""),
      status: readingStatusFilterSchema,
      tag: z.string().default(""),
    }),
  )
  .query(async ({ input, ctx }) =>
    withBooksQueryError(
      async () => {
        const userId = ctx.session.user.id;

        const { page, pageSize, search, sort, genre, author, publisher, series, format, status, tag } = input;

        const where = {
          userBooks: {
            some: {
              userId,
              ...(status ? { status } : {}),
              ...(tag ? { tags: { some: { tag: { name: tag } } } } : {}),
            },
          },
          ...buildBookWhereInput({
            search,
            genre,
            author,
            publisher,
            series,
            format,
          }),
        };

        const orderBy = buildOrderBy(sort, editionSortFields, { title: "asc" as const });

        return runPaginatedListQuery({
          page,
          pageSize,
          findMany: (pagination) =>
            prisma.book.findMany({
              where,
              orderBy,
              ...pagination,
              select: {
                id: true,
                slug: true,
                title: true,
                subtitle: true,
                coverId: true,
                publishYear: true,
                type: true,
                format: true,
                pageCount: true,
                audioSeconds: true,
                publisher: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
                authors: {
                  select: {
                    author: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                      },
                    },
                  },
                },
                series: {
                  take: 1,
                  select: {
                    series: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                      },
                    },
                    position: true,
                  },
                },
              },
            }),
          count: () => prisma.book.count({ where }),
          mapItem: mapBookListItem,
        });
      },
      "Error in myBooks query",
      "FETCH_USER_BOOKS_FAILED",
    ),
  );

/**
 * Get a book's details by slug.
 */
export const bookDetailsProcedure = protectedProcedure
  .input(z.object({ slug: z.string() }))
  .query(async ({ input, ctx }) => {
    try {
      const { slug } = input;
      const userId = ctx.session.user.id;

      const book = await prisma.book.findUnique({
        where: { slug },
        select: {
          id: true,
          slug: true,
          title: true,
          subtitle: true,
          description: true,
          hardcoverId: true,
          coverId: true,
          pageCount: true,
          audioSeconds: true,
          format: true,
          type: true,
          isbn10: true,
          isbn13: true,
          publishYear: true,
          publisher: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          authors: {
            select: {
              author: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          series: {
            select: {
              series: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
              position: true,
            },
          },
          genres: {
            select: {
              genre: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          userBooks: {
            where: { userId },
            select: {
              id: true,
              status: true,
              wantsToRead: true,
              rating: true,
              notes: true,
              tags: {
                select: {
                  tag: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
                orderBy: { tag: { name: "asc" } },
              },
              readThroughs: {
                orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }],
                select: {
                  id: true,
                  status: true,
                  progress: true,
                  startedAt: true,
                  stoppedAt: true,
                },
              },
            },
            take: 1,
          },
        },
      });

      if (!book) {
        throw new TRPCError({ code: "NOT_FOUND", message: "BOOK_NOT_FOUND" });
      }

      const userBook = book.userBooks[0] ?? null;
      const activeReadThrough =
        userBook?.readThroughs.find((readThrough) => isReadThroughActive(readThrough.status)) ?? null;
      const progressType = inferProgressType({
        type: book.type,
        pageCount: book.pageCount,
        audioSeconds: book.audioSeconds,
      });

      const bookData = {
        id: book.id,
        slug: book.slug,
        title: book.title,
        subtitle: book.subtitle,
        description: book.description,
        hardcoverId: book.hardcoverId,
        coverId: book.coverId,
        pageCount: book.pageCount,
        audioSeconds: book.audioSeconds,
        format: book.format,
        type: book.type,
        isbn10: book.isbn10,
        isbn13: book.isbn13,
        publishYear: book.publishYear,
        publisher: book.publisher,
      };

      return {
        ...bookData,
        authors: book.authors.map((a) => a.author),
        series: book.series.map((s) => ({
          id: s.series.id,
          name: s.series.name,
          slug: s.series.slug,
          position: s.position,
        })),
        genres: book.genres.map((g) => g.genre),
        userStatus: userBook?.status ?? null,
        userProgress: activeReadThrough?.progress ?? 0,
        userProgressType: progressType,
        userRating: userBook?.rating ?? null,
        userNotes: userBook?.notes ?? null,
        userTags: userBook?.tags.map((entry) => entry.tag) ?? [],
        userReadThroughs:
          userBook?.readThroughs.map((readThrough) => ({
            id: readThrough.id,
            status: readThrough.status,
            progress: readThrough.progress,
            startedAt: readThrough.startedAt.toISOString(),
            stoppedAt: readThrough.stoppedAt?.toISOString() ?? null,
          })) ?? [],
        userCompletedReadCount:
          userBook?.readThroughs.filter((readThrough) => readThrough.status === "COMPLETED").length ?? 0,
      };
    } catch (error) {
      if (error instanceof TRPCError && error.code === "NOT_FOUND") throw error;

      console.error("Error in bookDetails query:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "FETCH_BOOK_DETAILS_FAILED" });
    }
  });

/**
 * Get authors with search, sort, and pagination.
 */
export const allAuthorsProcedure = protectedProcedure.input(listInput).query(async ({ input }) => {
  return withBooksQueryError(
    async () => {
      const { page, pageSize, search, sort } = input;

      const where: Prisma.AuthorWhereInput = search ? { name: { contains: search } } : {};
      const orderBy = buildOrderBy<Prisma.AuthorOrderByWithRelationInput>(
        sort,
        {
          name: (dir) => ({ name: dir }),
          books: (dir) => ({ books: { _count: dir } }),
        },
        { name: "asc" },
      );

      return runPaginatedListQuery({
        page,
        pageSize,
        findMany: (pagination) =>
          prisma.author.findMany({
            where,
            orderBy,
            ...pagination,
            select: {
              id: true,
              slug: true,
              name: true,
              _count: {
                select: { books: true },
              },
            },
          }),
        count: () => prisma.author.count({ where }),
      });
    },
    "Error in allAuthors query",
    "FETCH_AUTHORS_FAILED",
  );
});

/**
 * Get genres with search, sort, and pagination.
 */
export const allGenresProcedure = protectedProcedure.input(listInput).query(async ({ input }) => {
  return withBooksQueryError(
    async () => {
      const { page, pageSize, search, sort } = input;

      const where: Prisma.GenreWhereInput = search ? { name: { contains: search } } : {};
      const orderBy = buildOrderBy<Prisma.GenreOrderByWithRelationInput>(
        sort,
        {
          name: (dir) => ({ name: dir }),
          books: (dir) => ({ books: { _count: dir } }),
        },
        { name: "asc" },
      );

      return runPaginatedListQuery({
        page,
        pageSize,
        findMany: (pagination) =>
          prisma.genre.findMany({
            where,
            orderBy,
            ...pagination,
            select: {
              id: true,
              slug: true,
              name: true,
              _count: {
                select: { books: true },
              },
            },
          }),
        count: () => prisma.genre.count({ where }),
      });
    },
    "Error in allGenres query",
    "FETCH_GENRES_FAILED",
  );
});

/**
 * Get publishers with search, sort, and pagination.
 */
export const allPublishersProcedure = protectedProcedure.input(listInput).query(async ({ input }) => {
  return withBooksQueryError(
    async () => {
      const { page, pageSize, search, sort } = input;

      const where: Prisma.PublisherWhereInput = search ? { name: { contains: search } } : {};
      const orderBy = buildOrderBy<Prisma.PublisherOrderByWithRelationInput>(
        sort,
        {
          name: (dir) => ({ name: dir }),
          books: (dir) => ({ books: { _count: dir } }),
        },
        { name: "asc" },
      );

      return runPaginatedListQuery({
        page,
        pageSize,
        findMany: (pagination) =>
          prisma.publisher.findMany({
            where,
            orderBy,
            ...pagination,
            select: {
              id: true,
              slug: true,
              name: true,
              _count: {
                select: { books: true },
              },
            },
          }),
        count: () => prisma.publisher.count({ where }),
      });
    },
    "Error in allPublishers query",
    "FETCH_PUBLISHERS_FAILED",
  );
});

/**
 * Get series with search, sort, and pagination.
 */
export const allSeriesProcedure = protectedProcedure.input(listInput).query(async ({ input }) => {
  return withBooksQueryError(
    async () => {
      const { page, pageSize, search, sort } = input;

      const where: Prisma.SeriesWhereInput = search ? { name: { contains: search } } : {};
      const orderBy = buildOrderBy<Prisma.SeriesOrderByWithRelationInput>(
        sort,
        {
          name: (dir) => ({ name: dir }),
          books: (dir) => ({ books: { _count: dir } }),
        },
        { name: "asc" },
      );

      return runPaginatedListQuery({
        page,
        pageSize,
        findMany: (pagination) =>
          prisma.series.findMany({
            where,
            orderBy,
            ...pagination,
            select: {
              id: true,
              slug: true,
              name: true,
              _count: {
                select: { books: true },
              },
            },
          }),
        count: () => prisma.series.count({ where }),
      });
    },
    "Error in allSeries query",
    "FETCH_SERIES_FAILED",
  );
});

/**
 * Get current user's tags with search, sort, and pagination.
 */
export const allTagsProcedure = protectedProcedure.input(listInput).query(async ({ input, ctx }) => {
  return withBooksQueryError(
    async () => {
      const userId = ctx.session.user.id;
      const { page, pageSize, search, sort } = input;

      const where: Prisma.TagWhereInput = {
        userId,
        ...(search ? { name: { contains: search } } : {}),
      };

      const orderBy = buildOrderBy<Prisma.TagOrderByWithRelationInput>(
        sort,
        {
          name: (dir) => ({ name: dir }),
          editions: (dir) => ({ entries: { _count: dir } }),
        },
        { name: "asc" },
      );

      return runPaginatedListQuery({
        page,
        pageSize,
        findMany: (pagination) =>
          prisma.tag.findMany({
            where,
            orderBy,
            ...pagination,
            select: {
              id: true,
              name: true,
              _count: {
                select: { entries: true },
              },
            },
          }),
        count: () => prisma.tag.count({ where }),
      });
    },
    "Error in allTags query",
    "FETCH_TAGS_FAILED",
  );
});

/**
 * Get series details by slug.
 */
export const seriesDetailsProcedure = protectedProcedure
  .input(z.object({ slug: z.string() }))
  .query(async ({ input }) => {
    try {
      const { slug } = input;

      const series = await prisma.series.findUnique({
        where: { slug },
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          books: {
            orderBy: { position: "asc" },
            select: {
              position: true,
              book: {
                select: {
                  id: true,
                  slug: true,
                  title: true,
                  subtitle: true,
                  coverId: true,
                  publishYear: true,
                  authors: {
                    select: {
                      author: {
                        select: { name: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!series) {
        throw new TRPCError({ code: "NOT_FOUND", message: "SERIES_NOT_FOUND" });
      }

      // Books are actually editions, so there can be multiple entries for the same work if it has multiple editions in the series.
      // Count unique works by position to get accurate work count.
      const uniqueEntries = new Set(series.books.map((bs) => bs.position));
      const entryCount = uniqueEntries.size;

      // Group books by position to display multiple editions of the same entry together
      type SeriesBook = {
        id: string;
        slug: string;
        title: string;
        subtitle: string | null;
        coverId: string | null;
        publishYear: number | null;
        authors: string[];
      };

      const map = new Map<number, SeriesBook[]>();

      for (const bs of series.books) {
        const pos = bs.position ?? -1;

        if (!map.has(pos)) map.set(pos, []);

        map.get(pos)!.push({
          id: bs.book.id,
          slug: bs.book.slug,
          title: bs.book.title,
          subtitle: bs.book.subtitle,
          coverId: bs.book.coverId,
          publishYear: bs.book.publishYear,
          authors: bs.book.authors.map((a) => a.author.name),
        });
      }

      const groupedBooks = [...map.entries()].map(([position, books]) => ({
        position,
        books,
      }));

      return {
        id: series?.id,
        slug: series?.slug,
        name: series?.name,
        description: series?.description,
        entryCount: entryCount,
        groupedBooks: groupedBooks,
      };
    } catch (error) {
      if (error instanceof TRPCError && error.code === "NOT_FOUND") throw error;

      console.error("Error in seriesDetails query:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "FETCH_SERIES_DETAILS_FAILED" });
    }
  });

/** All genres as filter options */
export const filterGenresProcedure = protectedProcedure.query(async () => {
  return prisma.genre.findMany({
    select: { slug: true, name: true },
    orderBy: { name: "asc" },
  });
});

/** All authors as filter options */
export const filterAuthorsProcedure = protectedProcedure.query(async () => {
  return prisma.author.findMany({
    select: { slug: true, name: true },
    orderBy: { name: "asc" },
  });
});

/** All publishers as filter options */
export const filterPublishersProcedure = protectedProcedure.query(async () => {
  return prisma.publisher.findMany({
    select: { slug: true, name: true },
    orderBy: { name: "asc" },
  });
});

/** All series as filter options */
export const filterSeriesProcedure = protectedProcedure.query(async () => {
  return prisma.series.findMany({
    select: { slug: true, name: true },
    orderBy: { name: "asc" },
  });
});

/** Current user's statuses as filter options */
export const filterStatusesProcedure = protectedProcedure.query(async () => {
  return READING_STATUS_VALUES.map((value) => ({ value }));
});

/** Current user's tags as filter options */
export const filterTagsProcedure = protectedProcedure.query(async ({ ctx }) => {
  const userId = ctx.session.user.id;
  return prisma.tag.findMany({
    where: { userId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
});

/**
 * All tags of current user for assignment UI.
 */
export const myTagsProcedure = protectedProcedure.query(async ({ ctx }) => {
  const userId = ctx.session.user.id;

  return prisma.tag.findMany({
    where: { userId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
});

/** Distinct edition formats */
export const filterFormatsProcedure = protectedProcedure.query(async () => {
  const results = await prisma.book.findMany({
    where: { format: { not: null } },
    select: { format: true },
    distinct: ["format"],
    orderBy: { format: "asc" },
  });
  return results.map((r) => r.format!).filter(Boolean);
});

/**
 * Resolve filter slugs/values to human-readable labels.
 * Used by active filter badges to show names instead of slugs,
 * even on direct URL navigation (without opening the filter dialog).
 */
export const resolveFilterLabelsProcedure = protectedProcedure
  .input(
    z.object({
      filters: z.array(
        z.object({
          type: z.enum(["genres", "authors", "publishers", "series", "statuses", "tags", "formats"]),
          value: z.string(),
        }),
      ),
    }),
  )
  .query(async ({ input }) => {
    const results: Record<string, string> = {};
    const slugsByType = {
      genres: new Set<string>(),
      authors: new Set<string>(),
      publishers: new Set<string>(),
      series: new Set<string>(),
    };

    for (const { type, value } of input.filters) {
      if (!value) continue;

      // Formats use the raw value as the label
      if (type === "formats") {
        results[`${type}:${value}`] = value;
        continue;
      }

      // Statuses use enum values, labels resolved client-side from locale files
      if (type === "statuses") {
        results[`${type}:${value}`] = value;
        continue;
      }

      // Tags use name as both key and label
      if (type === "tags") {
        results[`${type}:${value}`] = value;
        continue;
      }

      switch (type) {
        case "genres":
        case "authors":
        case "publishers":
        case "series":
          slugsByType[type].add(value);
          break;
      }
    }

    const [genres, authors, publishers, series] = await Promise.all([
      slugsByType.genres.size
        ? prisma.genre.findMany({
            where: { slug: { in: [...slugsByType.genres] } },
            select: { slug: true, name: true },
          })
        : [],
      slugsByType.authors.size
        ? prisma.author.findMany({
            where: { slug: { in: [...slugsByType.authors] } },
            select: { slug: true, name: true },
          })
        : [],
      slugsByType.publishers.size
        ? prisma.publisher.findMany({
            where: { slug: { in: [...slugsByType.publishers] } },
            select: { slug: true, name: true },
          })
        : [],
      slugsByType.series.size
        ? prisma.series.findMany({
            where: { slug: { in: [...slugsByType.series] } },
            select: { slug: true, name: true },
          })
        : [],
    ]);

    const slugLabelMap = new Map<string, string>();
    for (const item of genres) slugLabelMap.set(`genres:${item.slug}`, item.name);
    for (const item of authors) slugLabelMap.set(`authors:${item.slug}`, item.name);
    for (const item of publishers) slugLabelMap.set(`publishers:${item.slug}`, item.name);
    for (const item of series) slugLabelMap.set(`series:${item.slug}`, item.name);

    for (const { type, value } of input.filters) {
      if (!value || results[`${type}:${value}`]) continue;
      results[`${type}:${value}`] = slugLabelMap.get(`${type}:${value}`) ?? value;
    }

    return results;
  });
