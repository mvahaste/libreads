import { BOOK_COVER } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { protectedProcedure } from "@/lib/trpc/init";
import { hardcoverRouter } from "@/lib/trpc/routers/hardcover";
import { fetchWithTimeout } from "@/lib/utils/fetch";
import { normalizeAndValidateIsbn10, normalizeAndValidateIsbn13 } from "@/lib/utils/isbn";
import { processBookCoverImage } from "@/lib/utils/process-image";
import { generateUniqueSlug } from "@/lib/utils/slug";
import { importBookSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";

import { withProcedureErrorHandling } from "../../shared";

const hardcoverCaller = hardcoverRouter.createCaller;

function normalizeContentType(rawContentType: string | null): string {
  return (rawContentType ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
}

function isAcceptedCoverMimeType(mimeType: string): mimeType is (typeof BOOK_COVER.ACCEPTED_TYPES)[number] {
  return (BOOK_COVER.ACCEPTED_TYPES as readonly string[]).includes(mimeType);
}

function normalizeImportedIsbn(
  value: string | null | undefined,
  normalize: (input: string) => string | null,
): string | undefined {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  const normalized = normalize(trimmed);

  if (!normalized) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "IMPORTED_ISBN_INVALID" });
  }

  return normalized;
}

/**
 * Import a Hardcover edition into the local database as a book.
 */
export const importBookProcedure = protectedProcedure.input(importBookSchema).mutation(async ({ ctx, input }) => {
  return withProcedureErrorHandling(
    async () => {
      const { editionId } = input;

      const caller = hardcoverCaller(ctx);

      const editionData = await caller.editionDetails({ id: editionId });

      if (!editionData) {
        throw new TRPCError({ code: "NOT_FOUND", message: "EDITION_NOT_FOUND" });
      }

      const normalizedIsbn10 = normalizeImportedIsbn(editionData.isbn10, normalizeAndValidateIsbn10);
      const normalizedIsbn13 = normalizeImportedIsbn(editionData.isbn13, normalizeAndValidateIsbn13);

      // Ensure the book does not already exist in the database
      const existingBook = await prisma.book.findUnique({
        where: { hardcoverId: editionId },
      });

      if (existingBook) {
        throw new TRPCError({ code: "CONFLICT", message: "BOOK_ALREADY_EXISTS" });
      }

      // Download cover image if available
      let coverImageData: { mime: string; data: Buffer } | undefined;
      if (editionData.image?.url) {
        try {
          const response = await fetchWithTimeout(editionData.image.url, {}, 12000);

          if (response.ok) {
            const mimeType = normalizeContentType(response.headers.get("content-type"));

            if (isAcceptedCoverMimeType(mimeType)) {
              const chunks: Buffer[] = [];
              const reader = response.body?.getReader();

              if (reader) {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  if (value) chunks.push(Buffer.from(value));
                }

                const originalBuffer = Buffer.concat(chunks);
                const imageBuffer = await processBookCoverImage(originalBuffer);

                coverImageData = {
                  mime: "image/jpeg",
                  data: imageBuffer,
                };
              }
            } else {
              console.warn("Skipping cover image with unsupported content type:", {
                hardcoverEditionId: editionData.id,
                imageUrl: editionData.image.url,
                mimeType,
              });
            }
          } else {
            console.warn("Failed to download cover image:", {
              hardcoverEditionId: editionData.id,
              imageUrl: editionData.image.url,
              status: response.status,
              statusText: response.statusText,
            });
          }
        } catch (error) {
          console.warn("Failed to download cover image:", {
            hardcoverEditionId: editionData.id,
            imageUrl: editionData.image.url,
            error,
          });
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        /**
         * Create or find an entity.
         */
        async function findOrCreate<T extends { id: string }>(
          create: () => Promise<T>,
          options?: {
            findByHardcoverId?: () => Promise<T | null>;
            findByName?: () => Promise<T | null>;
          },
        ): Promise<T> {
          const byHardcoverId = await options?.findByHardcoverId?.();
          if (byHardcoverId) return byHardcoverId;

          const byName = await options?.findByName?.();
          if (byName) return byName;

          return create();
        }

        // 1. Find or create publisher
        let publisherId: string | undefined;
        if (editionData.publisher) {
          const publisher = await findOrCreate(
            async () => {
              const slug = await generateUniqueSlug(editionData.publisher!.name, async (s) => {
                return !!(await tx.publisher.findUnique({ where: { slug: s } }));
              });
              return tx.publisher.create({
                data: { name: editionData.publisher!.name, slug },
              });
            },
            {
              findByName: () => tx.publisher.findUnique({ where: { name: editionData.publisher!.name } }),
            },
          );
          publisherId = publisher.id;
        }

        // 2. Find or create all authors
        const authorMap = new Map<number, string>();
        for (const author of editionData.authors) {
          const dbAuthor = await findOrCreate(
            async () => {
              const slug = await generateUniqueSlug(author.name, async (s) => {
                return !!(await tx.author.findUnique({ where: { slug: s } }));
              });
              return tx.author.create({ data: { name: author.name, slug } });
            },
            {
              findByName: () => tx.author.findUnique({ where: { name: author.name } }),
            },
          );
          authorMap.set(author.id, dbAuthor.id);
        }

        // 3. Find or create all genres
        const genreMap = new Map<number, string>();
        for (const genre of editionData.genres) {
          const dbGenre = await findOrCreate(
            async () => {
              const slug = await generateUniqueSlug(genre.name, async (s) => {
                return !!(await tx.genre.findUnique({ where: { slug: s } }));
              });
              return tx.genre.create({ data: { name: genre.name, slug } });
            },
            {
              findByName: () => tx.genre.findUnique({ where: { name: genre.name } }),
            },
          );
          genreMap.set(genre.id, dbGenre.id);
        }

        // 4. Find or create all series
        const seriesMap = new Map<number, string>();
        for (const series of editionData.series) {
          const dbSeries = await findOrCreate(
            async () => {
              const slug = await generateUniqueSlug(series.name, async (sl) => {
                return !!(await tx.series.findUnique({ where: { slug: sl } }));
              });
              return tx.series.create({
                data: { name: series.name, description: series.description, slug },
              });
            },
            {
              findByName: () => tx.series.findUnique({ where: { name: series.name } }),
            },
          );
          seriesMap.set(series.id, dbSeries.id);
        }

        // 5. Create cover image if available
        let coverId: string | undefined;
        if (coverImageData) {
          const cover = await tx.image.create({
            data: {
              mime: coverImageData.mime,
              data: coverImageData.data as never,
            },
          });
          coverId = cover.id;
        }

        // 6. Create book
        const bookSlug = await generateUniqueSlug(editionData.title, async (s) => {
          return !!(await tx.book.findUnique({ where: { slug: s } }));
        });
        const book = await tx.book.create({
          data: {
            hardcoverId: editionData.id,
            slug: bookSlug,
            title: editionData.title,
            subtitle: editionData.subtitle,
            description: editionData.description,
            isbn10: normalizedIsbn10,
            isbn13: normalizedIsbn13,
            publishYear: editionData.releaseYear,
            type: editionData.type,
            format: editionData.format,
            pageCount: editionData.pages,
            audioSeconds: editionData.audioSeconds,
            coverId,
            publisherId,
          },
        });

        // 7. Create book-author, book-genre, and book-series joins
        const authorIds = [
          ...new Set(
            editionData.authors
              .map((author) => authorMap.get(author.id))
              .filter((authorId): authorId is string => typeof authorId === "string"),
          ),
        ];
        if (authorIds.length > 0) {
          await tx.bookAuthor.createMany({
            data: authorIds.map((authorId) => ({
              bookId: book.id,
              authorId,
            })),
          });
        }

        const genreIds = [
          ...new Set(
            editionData.genres
              .map((genre) => genreMap.get(genre.id))
              .filter((genreId): genreId is string => typeof genreId === "string"),
          ),
        ];
        if (genreIds.length > 0) {
          await tx.bookGenre.createMany({
            data: genreIds.map((genreId) => ({
              bookId: book.id,
              genreId,
            })),
          });
        }

        const seriesEntries = new Map<string, number | null>();
        for (const series of editionData.series) {
          const seriesId = seriesMap.get(series.id);

          if (!seriesId || seriesEntries.has(seriesId)) {
            continue;
          }

          // TODO: Handle null/0 position
          seriesEntries.set(seriesId, series.position);
        }

        if (seriesEntries.size > 0) {
          await tx.bookSeries.createMany({
            data: [...seriesEntries.entries()].map(([seriesId, position]) => ({
              bookId: book.id,
              seriesId,
              position,
            })),
          });
        }

        return book;
      });

      return { id: result.id, slug: result.slug };
    },
    {
      logLabel: "Error in importBook mutation",
      internalMessage: "IMPORT_FAILED",
    },
  );
});
