import { BookType, ReadingStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { protectedProcedure } from "@/lib/trpc/init";

export type StatisticsTopItem = {
  name: string;
  slug?: string;
  count: number;
};

async function mergeTopRows<T extends { count: number }>(
  rows: T[],
  lookup: Array<{ id: string; name: string; slug?: string }>,
): Promise<StatisticsTopItem[]> {
  const map = new Map(lookup.map((item) => [item.id, item]));

  return (
    rows
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((row: any) => {
        const item = map.get(row.id);

        if (!item) return null;

        return {
          name: item.name,
          slug: item.slug,
          count: row.count,
        };
      })
      .filter(Boolean) as StatisticsTopItem[]
  );
}

async function getTopAuthors(userId: string, limit = 6) {
  const rows = await prisma.bookAuthor.groupBy({
    by: ["authorId"],
    where: {
      book: {
        userBooks: {
          some: {
            userId,
            status: ReadingStatus.COMPLETED,
          },
        },
      },
    },
    _count: {
      bookId: true,
    },
    orderBy: {
      _count: {
        bookId: "desc",
      },
    },
    take: limit,
  });

  const authors = await prisma.author.findMany({
    where: {
      id: { in: rows.map((r) => r.authorId) },
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return mergeTopRows(
    rows.map((r) => ({ id: r.authorId, count: r._count.bookId })),
    authors,
  );
}

async function getTopGenres(userId: string, limit = 6) {
  const rows = await prisma.bookGenre.groupBy({
    by: ["genreId"],
    where: {
      book: {
        userBooks: {
          some: {
            userId,
            status: ReadingStatus.COMPLETED,
          },
        },
      },
    },
    _count: {
      bookId: true,
    },
    orderBy: {
      _count: {
        bookId: "desc",
      },
    },
    take: limit,
  });

  const genres = await prisma.genre.findMany({
    where: {
      id: { in: rows.map((r) => r.genreId) },
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return mergeTopRows(
    rows.map((r) => ({ id: r.genreId, count: r._count.bookId })),
    genres,
  );
}

async function getTopSeries(userId: string, limit = 6) {
  const rows = await prisma.bookSeries.groupBy({
    by: ["seriesId"],
    where: {
      book: {
        userBooks: {
          some: {
            userId,
            status: ReadingStatus.COMPLETED,
          },
        },
      },
    },
    _count: {
      bookId: true,
    },
    orderBy: {
      _count: {
        bookId: "desc",
      },
    },
    take: limit,
  });

  const series = await prisma.series.findMany({
    where: {
      id: { in: rows.map((r) => r.seriesId) },
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return mergeTopRows(
    rows.map((r) => ({ id: r.seriesId, count: r._count.bookId })),
    series,
  );
}

async function getTopPublishers(userId: string, limit = 6) {
  const rows = await prisma.book.groupBy({
    by: ["publisherId"],
    where: {
      publisherId: { not: null },
      userBooks: {
        some: {
          userId,
          status: ReadingStatus.COMPLETED,
        },
      },
    },
    _count: {
      publisherId: true,
    },
    orderBy: {
      _count: {
        publisherId: "desc",
      },
    },
    take: limit,
  });

  const publishers = await prisma.publisher.findMany({
    where: {
      id: { in: rows.map((r) => r.publisherId!).filter(Boolean) },
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return mergeTopRows(
    rows.filter((r) => r.publisherId).map((r) => ({ id: r.publisherId!, count: r._count.publisherId })),
    publishers,
  );
}

async function getTopTags(userId: string, limit = 6) {
  const rows = await prisma.tagBook.groupBy({
    by: ["tagId"],
    where: {
      userBook: {
        userId,
      },
    },
    _count: {
      tagId: true,
    },
    orderBy: {
      _count: {
        tagId: "desc",
      },
    },
    take: limit,
  });

  const tags = await prisma.tag.findMany({
    where: {
      id: { in: rows.map((r) => r.tagId) },
    },
    select: {
      id: true,
      name: true,
    },
  });

  return mergeTopRows(
    rows.map((r) => ({
      id: r.tagId,
      count: r._count.tagId,
    })),
    tags,
  );
}

export const overallUserStatsProcedure = protectedProcedure.query(async ({ ctx }) => {
  const userId = ctx.session.user.id;

  const totalBooks = await prisma.userBook.count({ where: { userId: userId } });

  const pagesRead = await prisma.readThrough.aggregate({
    where: {
      userBook: {
        userId: userId,
        book: {
          type: {
            in: [BookType.PHYSICAL, BookType.EBOOK],
          },
        },
      },
    },
    _sum: {
      progress: true,
    },
  });

  const secondsListened = await prisma.readThrough.aggregate({
    where: {
      userBook: {
        userId: userId,
        book: {
          type: BookType.AUDIOBOOK,
        },
      },
    },
    _sum: {
      progress: true,
    },
  });

  const averageRating = await prisma.userBook.aggregate({
    where: {
      userId: userId,
      rating: {
        not: null,
      },
    },
    _avg: {
      rating: true,
    },
  });

  const booksByStatus = await prisma.userBook.groupBy({
    by: ["status"],
    where: {
      userId: userId,
    },
    _count: {
      _all: true,
    },
  });

  const booksByType = await prisma.book.groupBy({
    by: ["type"],
    where: {
      userBooks: {
        some: {
          userId: userId,
        },
      },
    },
    _count: {
      _all: true,
    },
  });

  const topAuthors = await getTopAuthors(userId);
  const topSeries = await getTopSeries(userId);
  const topGenres = await getTopGenres(userId);
  const topPublishers = await getTopPublishers(userId);
  const topTags = await getTopTags(userId);

  return {
    totalBooks,
    pagesRead: pagesRead._sum.progress,
    secondsListened: secondsListened._sum.progress,
    averageRating: averageRating._avg.rating ? Math.round(averageRating._avg.rating * 100) / 100 : null,
    booksByStatus: booksByStatus.map((b) => ({
      status: b.status,
      count: b._count._all,
    })),
    booksByType: booksByType.map((b) => ({
      type: b.type,
      count: b._count._all,
    })),
    topAuthors,
    topSeries,
    topGenres,
    topPublishers,
    topTags,
  };
});
