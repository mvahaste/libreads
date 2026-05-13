import { Prisma, ReadThroughStatus, ReadingStatus } from "@/generated/prisma/client";
import {
  type BookForTransition,
  getMaxProgress,
  inferProgressType,
  isReadThroughActive,
  isReadThroughClosed,
  readThroughStatusToReadingStatus,
  recomputeBookStatus,
} from "@/lib/books/status-transitions";
import { prisma } from "@/lib/prisma";
import { protectedProcedure } from "@/lib/trpc/init";
import { TRPCError } from "@trpc/server";
import z from "zod/v4";

import { withProcedureErrorHandling } from "../../shared";

const MAX_NOTES_LENGTH = 5_000;

type TxClient = Prisma.TransactionClient;

const latestReadThroughOrderBy = [{ startedAt: "desc" as const }, { createdAt: "desc" as const }];

async function getLatestReadThrough(tx: TxClient, userBookId: string) {
  return tx.readThrough.findFirst({
    where: { userBookId },
    orderBy: latestReadThroughOrderBy,
    select: {
      id: true,
      status: true,
      progress: true,
    },
  });
}

async function ensureUserBook(tx: TxClient, userId: string, bookId: string) {
  const existing = await tx.userBook.findUnique({
    where: { userId_bookId: { userId, bookId } },
    select: { id: true, wantsToRead: true, status: true },
  });

  if (existing) {
    return existing;
  }

  return tx.userBook.create({
    data: {
      userId,
      bookId,
      status: null,
      wantsToRead: false,
    },
    select: { id: true, wantsToRead: true, status: true },
  });
}

async function persistRecomputedStatus(tx: TxClient, userBookId: string, wantsToRead: boolean) {
  const latestReadThrough = await getLatestReadThrough(tx, userBookId);
  const nextStatus = recomputeBookStatus({
    latestReadThroughStatus: latestReadThrough?.status ?? null,
    wantsToRead,
  });

  const updated = await tx.userBook.update({
    where: { id: userBookId },
    data: {
      wantsToRead,
      status: nextStatus,
    },
    select: { status: true },
  });

  return updated.status;
}

export const setBookStatusProcedure = protectedProcedure
  .input(
    z.object({
      bookId: z.string(),
      status: z.enum(ReadingStatus),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;
    const { bookId, status: newStatus } = input;

    const book = await prisma.book.findUniqueOrThrow({
      where: { id: bookId },
      select: { type: true, pageCount: true, audioSeconds: true },
    });

    const bookInfo: BookForTransition = {
      type: book.type,
      pageCount: book.pageCount,
      audioSeconds: book.audioSeconds,
    };
    const maxProgress = getMaxProgress(inferProgressType(bookInfo), bookInfo);

    const status = await prisma.$transaction(async (tx) => {
      const userBook = await ensureUserBook(tx, userId, bookId);

      if (newStatus === ReadingStatus.WANT_TO_READ) {
        const latestReadThrough = await getLatestReadThrough(tx, userBook.id);
        const nextStatus =
          latestReadThrough && isReadThroughActive(latestReadThrough.status)
            ? readThroughStatusToReadingStatus(latestReadThrough.status)
            : ReadingStatus.WANT_TO_READ;

        const updated = await tx.userBook.update({
          where: { id: userBook.id },
          data: {
            wantsToRead: true,
            status: nextStatus,
          },
          select: { status: true },
        });

        return updated.status;
      }

      const latestReadThrough = await getLatestReadThrough(tx, userBook.id);

      if (newStatus === ReadingStatus.READING) {
        if (latestReadThrough?.status === ReadThroughStatus.PAUSED) {
          await tx.readThrough.update({
            where: { id: latestReadThrough.id },
            data: {
              status: ReadThroughStatus.READING,
              stoppedAt: null,
            },
          });
        } else if (latestReadThrough?.status !== ReadThroughStatus.READING) {
          await tx.readThrough.create({
            data: {
              userBookId: userBook.id,
              status: ReadThroughStatus.READING,
              progress: 0,
            },
          });
        }
      }

      if (newStatus === ReadingStatus.PAUSED) {
        if (latestReadThrough && isReadThroughActive(latestReadThrough.status)) {
          await tx.readThrough.update({
            where: { id: latestReadThrough.id },
            data: {
              status: ReadThroughStatus.PAUSED,
            },
          });
        } else {
          await tx.readThrough.create({
            data: {
              userBookId: userBook.id,
              status: ReadThroughStatus.PAUSED,
              progress: 0,
            },
          });
        }
      }

      if (newStatus === ReadingStatus.COMPLETED) {
        if (latestReadThrough && isReadThroughActive(latestReadThrough.status)) {
          await tx.readThrough.update({
            where: { id: latestReadThrough.id },
            data: {
              status: ReadThroughStatus.COMPLETED,
              progress: maxProgress,
              stoppedAt: new Date(),
            },
          });
        } else {
          await tx.readThrough.create({
            data: {
              userBookId: userBook.id,
              status: ReadThroughStatus.COMPLETED,
              progress: maxProgress,
              stoppedAt: new Date(),
            },
          });
        }
      }

      if (newStatus === ReadingStatus.ABANDONED) {
        if (latestReadThrough && isReadThroughActive(latestReadThrough.status)) {
          await tx.readThrough.update({
            where: { id: latestReadThrough.id },
            data: {
              status: ReadThroughStatus.ABANDONED,
              stoppedAt: new Date(),
            },
          });
        } else {
          await tx.readThrough.create({
            data: {
              userBookId: userBook.id,
              status: ReadThroughStatus.ABANDONED,
              progress: 0,
              stoppedAt: new Date(),
            },
          });
        }
      }

      return persistRecomputedStatus(tx, userBook.id, false);
    });

    return {
      status,
      requiresConfirmation: false,
      warning: null,
    };
  });

export const setReadingProgressProcedure = protectedProcedure
  .input(
    z.object({
      bookId: z.string(),
      progress: z.number().int().min(0),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;

    const book = await prisma.book.findUniqueOrThrow({
      where: { id: input.bookId },
      select: { type: true, pageCount: true, audioSeconds: true },
    });

    const bookInfo: BookForTransition = {
      type: book.type,
      pageCount: book.pageCount,
      audioSeconds: book.audioSeconds,
    };

    const progressType = inferProgressType(bookInfo);
    const maxProgress = getMaxProgress(progressType, bookInfo);
    const clampedProgress = Math.min(input.progress, maxProgress);
    const autoCompleted = clampedProgress >= maxProgress;

    const status = await prisma.$transaction(async (tx) => {
      const userBook = await ensureUserBook(tx, userId, input.bookId);
      const latestReadThrough = await getLatestReadThrough(tx, userBook.id);

      const targetStatus = autoCompleted ? ReadThroughStatus.COMPLETED : ReadThroughStatus.READING;
      const stoppedAt = autoCompleted ? new Date() : null;

      if (latestReadThrough && isReadThroughActive(latestReadThrough.status)) {
        await tx.readThrough.update({
          where: { id: latestReadThrough.id },
          data: {
            progress: clampedProgress,
            status: targetStatus,
            stoppedAt,
          },
        });
      } else {
        await tx.readThrough.create({
          data: {
            userBookId: userBook.id,
            progress: clampedProgress,
            status: targetStatus,
            stoppedAt,
          },
        });
      }

      return persistRecomputedStatus(tx, userBook.id, false);
    });

    return {
      progress: clampedProgress,
      status: status ?? (autoCompleted ? ReadingStatus.COMPLETED : ReadingStatus.READING),
      autoCompleted,
      progressType,
      maxProgress,
    };
  });

export const deleteReadThroughProcedure = protectedProcedure
  .input(
    z.object({
      readThroughId: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;

    const status = await prisma.$transaction(async (tx) => {
      const readThrough = await tx.readThrough.findUnique({
        where: { id: input.readThroughId },
        select: {
          id: true,
          userBookId: true,
          status: true,
          userBook: {
            select: {
              userId: true,
              wantsToRead: true,
            },
          },
        },
      });

      if (!readThrough || readThrough.userBook.userId !== userId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "READ_THROUGH_NOT_FOUND" });
      }

      if (!isReadThroughClosed(readThrough.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "READ_THROUGH_DELETE_NOT_ALLOWED" });
      }

      await tx.readThrough.delete({ where: { id: readThrough.id } });

      return persistRecomputedStatus(tx, readThrough.userBookId, readThrough.userBook.wantsToRead);
    });

    return {
      success: true,
      status,
    };
  });

export const rateBookProcedure = protectedProcedure
  .input(
    z.object({
      bookId: z.string(),
      rating: z.number().min(0.5).max(5).multipleOf(0.5),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;
    const { bookId, rating } = input;

    const userBook = await prisma.userBook.findUnique({
      where: { userId_bookId: { userId, bookId } },
      select: { id: true },
    });

    if (!userBook) {
      throw new TRPCError({
        code: "NOT_FOUND",
      });
    }

    await prisma.userBook.update({
      where: { id: userBook.id },
      data: { rating },
    });

    return { rating };
  });

export const clearBookRatingProcedure = protectedProcedure
  .input(
    z.object({
      bookId: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;
    const { bookId } = input;

    const userBook = await prisma.userBook.findUnique({
      where: { userId_bookId: { userId, bookId } },
      select: { id: true },
    });

    if (!userBook) {
      throw new TRPCError({
        code: "NOT_FOUND",
      });
    }

    await prisma.userBook.update({
      where: { id: userBook.id },
      data: { rating: null },
    });

    return { rating: null };
  });

export const setBookNotesProcedure = protectedProcedure
  .input(
    z.object({
      bookId: z.string(),
      notes: z.string().trim().max(MAX_NOTES_LENGTH),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;
    const { bookId } = input;
    const normalizedNotes = input.notes.length > 0 ? input.notes : null;

    const userBook = await prisma.userBook.findUnique({
      where: { userId_bookId: { userId, bookId } },
      select: { id: true },
    });

    if (!userBook) {
      throw new TRPCError({
        code: "NOT_FOUND",
      });
    }

    const updated = await prisma.userBook.update({
      where: { id: userBook.id },
      data: {
        notes: normalizedNotes,
      },
      select: { notes: true },
    });

    return { notes: updated.notes };
  });

export const getLibraryEntryStatsProcedure = protectedProcedure
  .input(z.object({ bookId: z.string() }))
  .query(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;

    const userBook = await prisma.userBook.findUnique({
      where: { userId_bookId: { userId, bookId: input.bookId } },
      select: {
        _count: {
          select: {
            tags: true,
          },
        },
        rating: true,
        notes: true,
      },
    });

    if (!userBook) return null;

    return {
      tagCount: userBook._count.tags,
      hasRating: userBook.rating !== null,
      hasNotes: userBook.notes !== null && userBook.notes.length > 0,
    };
  });

export const removeBookFromLibraryProcedure = protectedProcedure
  .input(z.object({ bookId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;
    const { bookId } = input;

    await withProcedureErrorHandling(
      async () => {
        await prisma.userBook.delete({
          where: { userId_bookId: { userId, bookId } },
        });
      },
      {
        mapError: (error) => {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return new TRPCError({ code: "NOT_FOUND", message: "BOOK_NOT_IN_LIBRARY" });
          }

          return null;
        },
      },
    );

    return { success: true };
  });
