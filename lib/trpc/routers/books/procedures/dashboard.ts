import { ReadThroughStatus, ReadingStatus } from "@/generated/prisma/client";
import { getProgressPercent } from "@/lib/books/progress-display";
import { inferProgressType } from "@/lib/books/status-transitions";
import { prisma } from "@/lib/prisma";
import { protectedProcedure } from "@/lib/trpc/init";

import { withProcedureErrorHandling } from "../../shared";

const DASHBOARD_LIMITS = {
  currentlyReading: 5,
  upNext: 5,
  awaitingRating: 3,
  recentlyFinished: 3,
  recentActivity: 5,
  topTags: 8,
} as const;

const latestReadThroughOrderBy = [{ startedAt: "desc" as const }, { createdAt: "desc" as const }];

type SelectedBook = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  coverId: string | null;
  pageCount: number | null;
  audioSeconds: number | null;
  type: "PHYSICAL" | "EBOOK" | "AUDIOBOOK";
  authors: Array<{
    author: {
      id: string;
      name: string;
    };
  }>;
};

const selectedBookFields = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  coverId: true,
  pageCount: true,
  audioSeconds: true,
  type: true,
  authors: {
    select: {
      author: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} as const;

function mapBook(book: SelectedBook) {
  return {
    id: book.id,
    slug: book.slug,
    title: book.title,
    subtitle: book.subtitle,
    coverId: book.coverId,
    pageCount: book.pageCount,
    audioSeconds: book.audioSeconds,
    type: book.type,
    authors: book.authors.map((entry) => entry.author),
  };
}

export const dashboardSummaryProcedure = protectedProcedure.query(async ({ ctx }) => {
  return withProcedureErrorHandling(
    async () => {
      const userId = ctx.session.user.id;

      const [currentlyReadingRows, upNextRows, awaitingRatingRows, recentlyFinishedRows, topTagRows] =
        await Promise.all([
          prisma.userBook.findMany({
            where: {
              userId,
              status: ReadingStatus.READING,
            },
            orderBy: { updatedAt: "desc" },
            take: DASHBOARD_LIMITS.currentlyReading,
            select: {
              id: true,
              book: {
                select: selectedBookFields,
              },
              readThroughs: {
                where: {
                  status: {
                    in: [ReadThroughStatus.READING, ReadThroughStatus.PAUSED],
                  },
                },
                orderBy: latestReadThroughOrderBy,
                take: 1,
                select: {
                  progress: true,
                },
              },
            },
          }),
          prisma.userBook.findMany({
            where: {
              userId,
              status: ReadingStatus.WANT_TO_READ,
            },
            orderBy: { createdAt: "desc" },
            take: DASHBOARD_LIMITS.upNext,
            select: {
              id: true,
              createdAt: true,
              book: {
                select: selectedBookFields,
              },
            },
          }),
          prisma.readThrough.findMany({
            where: {
              status: ReadThroughStatus.COMPLETED,
              stoppedAt: { not: null },
              userBook: {
                userId,
                status: ReadingStatus.COMPLETED,
                rating: null,
              },
            },
            orderBy: [{ stoppedAt: "desc" }, { createdAt: "desc" }],
            distinct: ["userBookId"],
            take: DASHBOARD_LIMITS.awaitingRating,
            select: {
              stoppedAt: true,
              userBook: {
                select: {
                  book: {
                    select: selectedBookFields,
                  },
                },
              },
            },
          }),
          prisma.readThrough.findMany({
            where: {
              status: ReadThroughStatus.COMPLETED,
              stoppedAt: { not: null },
              userBook: {
                userId,
                status: ReadingStatus.COMPLETED,
              },
            },
            orderBy: [{ stoppedAt: "desc" }, { createdAt: "desc" }],
            distinct: ["userBookId"],
            take: DASHBOARD_LIMITS.recentlyFinished,
            select: {
              stoppedAt: true,
              userBook: {
                select: {
                  book: {
                    select: selectedBookFields,
                  },
                },
              },
            },
          }),
          prisma.tagBook.groupBy({
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
            take: DASHBOARD_LIMITS.topTags,
          }),
        ] as const);

      const [recentlyStartedRows, topTags] = await Promise.all([
        prisma.readThrough.findMany({
          where: {
            status: ReadThroughStatus.READING,
            userBook: {
              userId,
            },
          },
          orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }],
          take: DASHBOARD_LIMITS.recentActivity,
          select: {
            startedAt: true,
            userBook: {
              select: {
                book: {
                  select: {
                    slug: true,
                    title: true,
                  },
                },
              },
            },
          },
        }),
        prisma.tag.findMany({
          where: {
            id: { in: topTagRows.map((row) => row.tagId) },
          },
          select: {
            id: true,
            name: true,
          },
        }),
      ]);

      const recentCompletedRows = recentlyFinishedRows
        .filter((row): row is typeof row & { stoppedAt: Date } => row.stoppedAt !== null)
        .map((row) => ({
          at: row.stoppedAt,
          book: {
            slug: row.userBook.book.slug,
            title: row.userBook.book.title,
          },
        }));

      const recentWantToReadRows = upNextRows.map((row) => ({
        at: row.createdAt,
        book: {
          slug: row.book.slug,
          title: row.book.title,
        },
      }));

      const recentActivity = [
        ...recentlyStartedRows.map((row) => ({
          type: "STARTED" as const,
          at: row.startedAt,
          book: row.userBook.book,
        })),
        ...recentCompletedRows.map((row) => ({
          type: "FINISHED" as const,
          at: row.at,
          book: row.book,
        })),
        ...recentWantToReadRows.map((row) => ({
          type: "ADDED_TO_WANT_TO_READ" as const,
          at: row.at,
          book: row.book,
        })),
      ]
        .sort((a, b) => b.at.getTime() - a.at.getTime())
        .slice(0, DASHBOARD_LIMITS.recentActivity)
        .map((entry) => ({
          type: entry.type,
          at: entry.at.toISOString(),
          book: entry.book,
        }));

      const tagMap = new Map(topTags.map((tag) => [tag.id, tag]));

      return {
        currentlyReading: currentlyReadingRows.map((row) => {
          const book = mapBook(row.book);
          const progress = row.readThroughs[0]?.progress ?? 0;
          const progressType = inferProgressType({
            type: row.book.type,
            pageCount: row.book.pageCount,
            audioSeconds: row.book.audioSeconds,
          });

          return {
            id: row.id,
            book,
            progress,
            progressType,
            progressPercent: getProgressPercent({
              progress,
              progressType,
              pageCount: row.book.pageCount,
              audioSeconds: row.book.audioSeconds,
            }),
          };
        }),
        upNext: upNextRows.map((row) => ({
          id: row.id,
          addedAt: row.createdAt.toISOString(),
          book: mapBook(row.book),
        })),
        awaitingRating: awaitingRatingRows
          .filter((row): row is typeof row & { stoppedAt: Date } => row.stoppedAt !== null)
          .map((row) => ({
            finishedAt: row.stoppedAt.toISOString(),
            book: mapBook(row.userBook.book),
          })),
        recentlyFinished: recentlyFinishedRows
          .filter((row): row is typeof row & { stoppedAt: Date } => row.stoppedAt !== null)
          .map((row) => ({
            finishedAt: row.stoppedAt.toISOString(),
            book: mapBook(row.userBook.book),
          })),
        recentActivity,
        topTags: topTagRows
          .map((row) => {
            const tag = tagMap.get(row.tagId);

            if (!tag) return null;

            return {
              id: tag.id,
              name: tag.name,
              count: row._count.tagId,
            };
          })
          .filter(Boolean),
        limits: DASHBOARD_LIMITS,
      };
    },
    {
      logLabel: "Error in dashboard summary query",
      internalMessage: "FETCH_DASHBOARD_SUMMARY_FAILED",
    },
  );
});
