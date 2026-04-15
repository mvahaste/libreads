import { BOOK_COVER } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { protectedProcedure } from "@/lib/trpc/init";
import { hardcoverRouter } from "@/lib/trpc/routers/hardcover";
import { fetchWithTimeout } from "@/lib/utils/fetch";
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

async function readResponseBufferWithLimit(response: Response, maxBytes: number): Promise<Buffer<ArrayBuffer>> {
  const contentLengthHeader = response.headers.get("content-length");

  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);

    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      throw new Error(`Cover image exceeds max size (${maxBytes} bytes)`);
    }
  }

  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error("Cover image response has no readable body");
  }

  const chunks: Buffer[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    if (!value) {
      continue;
    }

    totalBytes += value.byteLength;

    if (totalBytes > maxBytes) {
      throw new Error(`Cover image exceeds max size (${maxBytes} bytes)`);
    }

    chunks.push(Buffer.from(value));
  }

  return Buffer.concat(chunks) as Buffer<ArrayBuffer>;
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

      // Ensure the book does not already exist in the database
      const existingBook = await prisma.book.findUnique({
        where: { hardcoverId: editionId },
      });

      if (existingBook) {
        throw new TRPCError({ code: "CONFLICT", message: "BOOK_ALREADY_EXISTS" });
      }

      // Download cover image if available
      let coverImageData: { mime: string; data: Buffer<ArrayBuffer> } | undefined;
      if (editionData.image?.url) {
        try {
          const imageResponse = await fetchWithTimeout(editionData.image.url, {}, 12000);

          if (imageResponse.ok) {
            const mimeType = normalizeContentType(imageResponse.headers.get("content-type"));

            if (!isAcceptedCoverMimeType(mimeType)) {
              console.warn("Skipping cover image with unsupported content type:", {
                hardcoverEditionId: editionData.id,
                imageUrl: editionData.image.url,
                mimeType,
              });
            } else {
              const imageBuffer = await readResponseBufferWithLimit(imageResponse, BOOK_COVER.MAX_SIZE);

              coverImageData = {
                mime: mimeType,
                data: imageBuffer,
              };
            }
          } else {
            console.warn("Failed to download cover image:", {
              hardcoverEditionId: editionData.id,
              imageUrl: editionData.image.url,
              status: imageResponse.status,
              statusText: imageResponse.statusText,
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
         * Create or find an entity. Primarily find by Hardcover ID but optionally by name as well.
         * Some entities, e.g. genres, appear under multiple IDs.
         */
        async function findOrCreate<T extends { id: string }>(
          create: () => Promise<T>,
          findByHardcoverId: () => Promise<T | null>,
          findByName?: () => Promise<T | null>,
        ): Promise<T> {
          const byHardcoverId = await findByHardcoverId();
          if (byHardcoverId) return byHardcoverId;

          if (findByName) {
            const byName = await findByName();
            if (byName) return byName;
          }

          return create();
        }

        // 1. Find or create publisher (check hardcover ID and name)
        let publisherId: string | undefined;
        if (editionData.publisher) {
          const publisher = await findOrCreate(
            async () => {
              const slug = await generateUniqueSlug(editionData.publisher!.name, async (s) => {
                return !!(await tx.publisher.findUnique({ where: { slug: s } }));
              });
              return tx.publisher.create({
                data: { hardcoverId: editionData.publisher!.id, name: editionData.publisher!.name, slug },
              });
            },
            () => tx.publisher.findUnique({ where: { hardcoverId: editionData.publisher!.id } }),
            () => tx.publisher.findUnique({ where: { name: editionData.publisher!.name } }),
          );
          publisherId = publisher.id;
        }

        // 2. Find or create all authors (check hardcover ID, *not* name since different authors can have the same name)
        const authorMap = new Map<number, string>();
        for (const author of editionData.authors) {
          const dbAuthor = await findOrCreate(
            async () => {
              const slug = await generateUniqueSlug(author.name, async (s) => {
                return !!(await tx.author.findUnique({ where: { slug: s } }));
              });
              return tx.author.create({ data: { hardcoverId: author.id, name: author.name, slug } });
            },
            () => tx.author.findUnique({ where: { hardcoverId: author.id } }),
          );
          authorMap.set(author.id, dbAuthor.id);
        }

        // 3. Find or create all genres (check hardcover ID and name)
        const genreMap = new Map<number, string>();
        for (const genre of editionData.genres) {
          const dbGenre = await findOrCreate(
            async () => {
              const slug = await generateUniqueSlug(genre.name, async (s) => {
                return !!(await tx.genre.findUnique({ where: { slug: s } }));
              });
              return tx.genre.create({ data: { hardcoverId: genre.id, name: genre.name, slug } });
            },
            () => tx.genre.findUnique({ where: { hardcoverId: genre.id } }),
            () => tx.genre.findUnique({ where: { name: genre.name } }),
          );
          genreMap.set(genre.id, dbGenre.id);
        }

        // 4. Find or create all series (check hardcover ID and name)
        const seriesMap = new Map<number, string>();
        for (const series of editionData.series) {
          const dbSeries = await findOrCreate(
            async () => {
              const slug = await generateUniqueSlug(series.name, async (sl) => {
                return !!(await tx.series.findUnique({ where: { slug: sl } }));
              });
              return tx.series.create({
                data: { hardcoverId: series.id, name: series.name, description: series.description, slug },
              });
            },
            () => tx.series.findUnique({ where: { hardcoverId: series.id } }),
            () => tx.series.findUnique({ where: { name: series.name } }),
          );
          seriesMap.set(series.id, dbSeries.id);
        }

        // 5. Create cover image if available
        let coverId: string | undefined;
        if (coverImageData) {
          const cover = await tx.image.create({
            data: {
              mime: coverImageData.mime,
              data: coverImageData.data,
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
            isbn10: editionData.isbn10,
            isbn13: editionData.isbn13,
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
