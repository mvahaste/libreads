import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { adminProcedure, protectedProcedure } from "@/lib/trpc/init";
import {
  getDetachedIds,
  mapUpdateBookConflict,
  normalizeNullableText,
  resolveAuthorRef,
  resolveGenreRef,
  resolvePublisherRef,
  resolveSeriesEntries,
  resolveUniqueRelationRefs,
} from "@/lib/utils/books/update-book-helpers";
import { generateUniqueSlug } from "@/lib/utils/slug";
import { bookUniqueConflictSchema, createBookSchema, updateBookSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import z from "zod/v4";

import { withProcedureErrorHandling } from "../../shared";

async function assertCoverExists(tx: Prisma.TransactionClient, coverId: string | null | undefined) {
  if (coverId === undefined || coverId === null) {
    return;
  }

  const cover = await tx.image.findUnique({
    where: { id: coverId },
    select: { id: true },
  });

  if (!cover) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "COVER_NOT_FOUND" });
  }
}

async function getBookUniqueConflicts(input: {
  excludeBookId?: string;
  hardcoverId: number | null;
  isbn10: string | null;
  isbn13: string | null;
}) {
  const { excludeBookId, hardcoverId, isbn10, isbn13 } = input;

  const excludeWhere = excludeBookId
    ? {
        id: { not: excludeBookId },
      }
    : {};

  const [hardcoverIdConflict, isbn10Conflict, isbn13Conflict] = await Promise.all([
    hardcoverId !== null
      ? prisma.book.findFirst({
          where: {
            hardcoverId,
            ...excludeWhere,
          },
          select: { id: true },
        })
      : null,
    isbn10
      ? prisma.book.findFirst({
          where: {
            isbn10,
            ...excludeWhere,
          },
          select: { id: true },
        })
      : null,
    isbn13
      ? prisma.book.findFirst({
          where: {
            isbn13,
            ...excludeWhere,
          },
          select: { id: true },
        })
      : null,
  ]);

  return {
    hardcoverId: Boolean(hardcoverIdConflict),
    isbn10: Boolean(isbn10Conflict),
    isbn13: Boolean(isbn13Conflict),
  };
}

async function getBookFormOptions() {
  const [authors, genres, publishers, series] = await Promise.all([
    prisma.author.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    prisma.genre.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    prisma.publisher.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    prisma.series.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    authors,
    genres,
    publishers,
    series,
  };
}

function mapBookMutationConflictError(error: unknown): TRPCError | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return mapUpdateBookConflict(error);
  }

  return null;
}

/**
 * Create a new book and linked entities.
 * Authenticated users only.
 */
export const createBookProcedure = protectedProcedure.input(createBookSchema).mutation(async ({ input }) => {
  return withProcedureErrorHandling(
    async () => {
      return prisma.$transaction(async (tx) => {
        let publisherId: string | null = null;
        if (input.publisher !== undefined) {
          publisherId = await resolvePublisherRef(tx, input.publisher);
        }

        const authorIds = input.authors
          ? await resolveUniqueRelationRefs(input.authors, (ref) => resolveAuthorRef(tx, ref))
          : [];

        const genreIds = input.genres
          ? await resolveUniqueRelationRefs(input.genres, (ref) => resolveGenreRef(tx, ref))
          : [];

        const seriesEntries = input.series ? await resolveSeriesEntries(tx, input.series) : [];

        await assertCoverExists(tx, input.coverId);

        const generatedSlug = await generateUniqueSlug(input.title, async (candidate) => {
          const existing = await tx.book.findFirst({
            where: {
              slug: candidate,
            },
            select: { id: true },
          });

          return Boolean(existing);
        });

        const createdBook = await tx.book.create({
          data: {
            title: input.title,
            slug: generatedSlug,
            subtitle: normalizeNullableText(input.subtitle),
            description: normalizeNullableText(input.description),
            publishYear: input.publishYear,
            type: input.type,
            format: normalizeNullableText(input.format),
            pageCount: input.pageCount,
            audioSeconds: input.audioSeconds,
            isbn10: normalizeNullableText(input.isbn10),
            isbn13: normalizeNullableText(input.isbn13),
            hardcoverId: input.hardcoverId,
            publisherId: publisherId ?? undefined,
            coverId: input.coverId ?? undefined,
          },
          select: {
            id: true,
            slug: true,
          },
        });

        if (authorIds.length > 0) {
          await tx.bookAuthor.createMany({
            data: authorIds.map((authorId) => ({
              bookId: createdBook.id,
              authorId,
            })),
          });
        }

        if (genreIds.length > 0) {
          await tx.bookGenre.createMany({
            data: genreIds.map((genreId) => ({
              bookId: createdBook.id,
              genreId,
            })),
          });
        }

        if (seriesEntries.length > 0) {
          await tx.bookSeries.createMany({
            data: seriesEntries.map((entry) => ({
              bookId: createdBook.id,
              seriesId: entry.seriesId,
              position: entry.position,
            })),
          });
        }

        return createdBook;
      });
    },
    {
      mapError: mapBookMutationConflictError,
      logLabel: "Error in createBook mutation",
      internalMessage: "CREATE_BOOK_FAILED",
    },
  );
});

/**
 * Update a book's metadata and linked entities.
 * Admin only.
 */
export const updateBookProcedure = adminProcedure.input(updateBookSchema).mutation(async ({ input }) => {
  return withProcedureErrorHandling(
    async () => {
      return prisma.$transaction(async (tx) => {
        const existingBook = await tx.book.findUnique({
          where: { id: input.bookId },
          select: {
            id: true,
            publisherId: true,
            coverId: true,
            authors: {
              select: {
                authorId: true,
              },
            },
            genres: {
              select: {
                genreId: true,
              },
            },
            series: {
              select: {
                seriesId: true,
              },
            },
          },
        });

        if (!existingBook) {
          throw new TRPCError({ code: "NOT_FOUND", message: "BOOK_NOT_FOUND" });
        }

        const previousPublisherId = existingBook.publisherId;
        const previousCoverId = existingBook.coverId;
        const previousAuthorIds = [...new Set(existingBook.authors.map((entry) => entry.authorId))];
        const previousGenreIds = [...new Set(existingBook.genres.map((entry) => entry.genreId))];
        const previousSeriesIds = [...new Set(existingBook.series.map((entry) => entry.seriesId))];

        let publisherId: string | null | undefined;
        if (input.publisher !== undefined) {
          publisherId = await resolvePublisherRef(tx, input.publisher);
        }

        let authorIds: string[] | undefined;
        if (input.authors !== undefined) {
          authorIds = await resolveUniqueRelationRefs(input.authors, (ref) => resolveAuthorRef(tx, ref));
        }

        let genreIds: string[] | undefined;
        if (input.genres !== undefined) {
          genreIds = await resolveUniqueRelationRefs(input.genres, (ref) => resolveGenreRef(tx, ref));
        }

        let seriesEntries:
          | {
              seriesId: string;
              position: number | null;
            }[]
          | undefined;
        if (input.series !== undefined) {
          seriesEntries = await resolveSeriesEntries(tx, input.series);
        }

        await assertCoverExists(tx, input.coverId);

        const generatedSlug = await generateUniqueSlug(input.title, async (candidate) => {
          const existing = await tx.book.findFirst({
            where: {
              slug: candidate,
              id: { not: input.bookId },
            },
            select: { id: true },
          });

          return Boolean(existing);
        });

        const updatedBook = await tx.book.update({
          where: { id: input.bookId },
          data: {
            title: input.title,
            slug: generatedSlug,
            subtitle: normalizeNullableText(input.subtitle),
            description: normalizeNullableText(input.description),
            publishYear: input.publishYear,
            type: input.type,
            format: normalizeNullableText(input.format),
            pageCount: input.pageCount,
            audioSeconds: input.audioSeconds,
            isbn10: normalizeNullableText(input.isbn10),
            isbn13: normalizeNullableText(input.isbn13),
            hardcoverId: input.hardcoverId,
            ...(publisherId !== undefined
              ? {
                  publisher: publisherId
                    ? { connect: { id: publisherId } }
                    : {
                        disconnect: true,
                      },
                }
              : {}),
            ...(input.coverId !== undefined
              ? {
                  cover: input.coverId
                    ? { connect: { id: input.coverId } }
                    : {
                        disconnect: true,
                      },
                }
              : {}),
          },
          select: {
            id: true,
            slug: true,
          },
        });

        if (authorIds !== undefined) {
          await tx.bookAuthor.deleteMany({ where: { bookId: input.bookId } });

          if (authorIds.length > 0) {
            await tx.bookAuthor.createMany({
              data: authorIds.map((authorId) => ({
                bookId: input.bookId,
                authorId,
              })),
            });
          }
        }

        if (genreIds !== undefined) {
          await tx.bookGenre.deleteMany({ where: { bookId: input.bookId } });

          if (genreIds.length > 0) {
            await tx.bookGenre.createMany({
              data: genreIds.map((genreId) => ({
                bookId: input.bookId,
                genreId,
              })),
            });
          }
        }

        if (seriesEntries !== undefined) {
          await tx.bookSeries.deleteMany({ where: { bookId: input.bookId } });

          if (seriesEntries.length > 0) {
            await tx.bookSeries.createMany({
              data: seriesEntries.map((entry) => ({
                bookId: input.bookId,
                seriesId: entry.seriesId,
                position: entry.position,
              })),
            });
          }
        }

        if (input.publisher !== undefined && previousPublisherId && previousPublisherId !== publisherId) {
          await tx.publisher.deleteMany({
            where: {
              id: previousPublisherId,
              books: { none: {} },
            },
          });
        }

        if (authorIds !== undefined) {
          const detachedAuthorIds = getDetachedIds(previousAuthorIds, authorIds);

          if (detachedAuthorIds.length > 0) {
            await tx.author.deleteMany({
              where: {
                id: { in: detachedAuthorIds },
                books: { none: {} },
              },
            });
          }
        }

        if (genreIds !== undefined) {
          const detachedGenreIds = getDetachedIds(previousGenreIds, genreIds);

          if (detachedGenreIds.length > 0) {
            await tx.genre.deleteMany({
              where: {
                id: { in: detachedGenreIds },
                books: { none: {} },
              },
            });
          }
        }

        if (seriesEntries !== undefined) {
          const nextSeriesIds = seriesEntries.map((entry) => entry.seriesId);
          const detachedSeriesIds = getDetachedIds(previousSeriesIds, nextSeriesIds);

          if (detachedSeriesIds.length > 0) {
            await tx.series.deleteMany({
              where: {
                id: { in: detachedSeriesIds },
                books: { none: {} },
              },
            });
          }
        }

        if (input.coverId !== undefined && previousCoverId && previousCoverId !== input.coverId) {
          await tx.image.deleteMany({
            where: {
              id: previousCoverId,
              books: { none: {} },
              users: { none: {} },
            },
          });
        }

        return updatedBook;
      });
    },
    {
      mapError: mapBookMutationConflictError,
      logLabel: "Error in updateBook mutation",
      internalMessage: "UPDATE_BOOK_FAILED",
    },
  );
});

/** Live uniqueness checks for the shared book form (create/edit/import confirmation). */
export const bookFormConflictsProcedure = protectedProcedure
  .input(bookUniqueConflictSchema)
  .query(async ({ input }) => {
    return getBookUniqueConflicts(input);
  });

/** Live uniqueness checks for admin-only edit usage (legacy route shape). */
export const bookEditConflictsProcedure = adminProcedure
  .input(bookUniqueConflictSchema.extend({ bookId: z.string().min(1) }))
  .query(async ({ input }) => {
    return getBookUniqueConflicts({
      excludeBookId: input.bookId,
      hardcoverId: input.hardcoverId,
      isbn10: input.isbn10,
      isbn13: input.isbn13,
    });
  });

/** Relation options for the shared book form (create/edit/import confirmation). */
export const bookFormOptionsProcedure = protectedProcedure.query(async () => {
  return getBookFormOptions();
});

/** Relation options for admin-only edit usage (legacy endpoint). */
export const bookEditOptionsProcedure = adminProcedure.query(async () => {
  return getBookFormOptions();
});

/**
 * Delete a book and all related data.
 * Admin only.
 */
export const deleteBookProcedure = adminProcedure
  .input(z.object({ bookId: z.string().min(1) }))
  .mutation(async ({ input }) => {
    return withProcedureErrorHandling(
      async () => {
        const bookRelations = await prisma.book.findUnique({
          where: { id: input.bookId },
          select: {
            coverId: true,
            publisherId: true,
            authors: { select: { authorId: true } },
            genres: { select: { genreId: true } },
            series: { select: { seriesId: true } },
          },
        });

        if (!bookRelations) {
          throw new TRPCError({ code: "NOT_FOUND", message: "BOOK_NOT_FOUND" });
        }

        const authorIds = bookRelations.authors.map((a) => a.authorId);
        const genreIds = bookRelations.genres.map((g) => g.genreId);
        const seriesIds = bookRelations.series.map((s) => s.seriesId);
        const publisherId = bookRelations.publisherId;
        const coverId = bookRelations.coverId;

        await prisma.$transaction(async (tx) => {
          await tx.book.delete({
            where: { id: input.bookId },
          });

          if (authorIds.length > 0) {
            await tx.author.deleteMany({
              where: {
                id: { in: authorIds },
                books: { none: {} },
              },
            });
          }

          if (genreIds.length > 0) {
            await tx.genre.deleteMany({
              where: {
                id: { in: genreIds },
                books: { none: {} },
              },
            });
          }

          if (seriesIds.length > 0) {
            await tx.series.deleteMany({
              where: {
                id: { in: seriesIds },
                books: { none: {} },
              },
            });
          }

          if (publisherId) {
            await tx.publisher.deleteMany({
              where: {
                id: publisherId,
                books: { none: {} },
              },
            });
          }

          if (coverId) {
            await tx.image.deleteMany({
              where: {
                id: coverId,
                books: { none: {} },
                users: { none: {} },
              },
            });
          }
        });

        return { success: true };
      },
      {
        logLabel: "Error in deleteBook mutation",
        internalMessage: "DELETE_BOOK_FAILED",
      },
    );
  });
