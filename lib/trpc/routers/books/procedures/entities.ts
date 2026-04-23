import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { mapUniqueConstraintError } from "@/lib/trpc/error-mappers";
import { adminProcedure } from "@/lib/trpc/init";
import { generateUniqueSlug } from "@/lib/utils/slug";
import { TRPCError } from "@trpc/server";
import z from "zod/v4";

const entityNameSchema = z.string().trim().min(1).max(160);

function mapEntityDuplicateError(error: unknown, message: string) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }

  return mapUniqueConstraintError(error, {
    name: message,
    slug: message,
  });
}

/**
 * Update an author.
 * Admin only.
 */
export const updateAuthorProcedure = adminProcedure
  .input(
    z.object({
      authorId: z.string().min(1),
      name: entityNameSchema,
    }),
  )
  .mutation(async ({ input }) => {
    const trimmedName = input.name.trim();

    const existing = await prisma.author.findUnique({
      where: { id: input.authorId },
      select: { id: true },
    });

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "AUTHOR_NOT_FOUND" });
    }

    const duplicate = await prisma.author.findFirst({
      where: {
        name: trimmedName,
        id: { not: input.authorId },
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new TRPCError({ code: "CONFLICT", message: "AUTHOR_ALREADY_EXISTS" });
    }

    try {
      const slug = await generateUniqueSlug(trimmedName, async (candidate) => {
        const existingBySlug = await prisma.author.findFirst({
          where: {
            slug: candidate,
            id: { not: input.authorId },
          },
          select: { id: true },
        });

        return Boolean(existingBySlug);
      });

      return prisma.author.update({
        where: { id: input.authorId },
        data: {
          name: trimmedName,
          slug,
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });
    } catch (error) {
      const mappedError = mapEntityDuplicateError(error, "AUTHOR_ALREADY_EXISTS");

      if (mappedError) {
        throw mappedError;
      }

      throw error;
    }
  });

/**
 * Delete an author.
 * Admin only.
 */
export const deleteAuthorProcedure = adminProcedure
  .input(
    z.object({
      authorId: z.string().min(1),
    }),
  )
  .mutation(async ({ input }) => {
    const deleted = await prisma.author.deleteMany({
      where: { id: input.authorId },
    });

    if (!deleted.count) {
      throw new TRPCError({ code: "NOT_FOUND", message: "AUTHOR_NOT_FOUND" });
    }

    return { success: true };
  });

/**
 * Update a series.
 * Admin only.
 */
export const updateSeriesProcedure = adminProcedure
  .input(
    z.object({
      seriesId: z.string().min(1),
      name: entityNameSchema,
    }),
  )
  .mutation(async ({ input }) => {
    const trimmedName = input.name.trim();

    const existing = await prisma.series.findUnique({
      where: { id: input.seriesId },
      select: { id: true },
    });

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "SERIES_NOT_FOUND" });
    }

    const duplicate = await prisma.series.findFirst({
      where: {
        name: trimmedName,
        id: { not: input.seriesId },
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new TRPCError({ code: "CONFLICT", message: "SERIES_ALREADY_EXISTS" });
    }

    try {
      const slug = await generateUniqueSlug(trimmedName, async (candidate) => {
        const existingBySlug = await prisma.series.findFirst({
          where: {
            slug: candidate,
            id: { not: input.seriesId },
          },
          select: { id: true },
        });

        return Boolean(existingBySlug);
      });

      return prisma.series.update({
        where: { id: input.seriesId },
        data: {
          name: trimmedName,
          slug,
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });
    } catch (error) {
      const mappedError = mapEntityDuplicateError(error, "SERIES_ALREADY_EXISTS");

      if (mappedError) {
        throw mappedError;
      }

      throw error;
    }
  });

/**
 * Delete a series.
 * Admin only.
 */
export const deleteSeriesProcedure = adminProcedure
  .input(
    z.object({
      seriesId: z.string().min(1),
    }),
  )
  .mutation(async ({ input }) => {
    const deleted = await prisma.series.deleteMany({
      where: { id: input.seriesId },
    });

    if (!deleted.count) {
      throw new TRPCError({ code: "NOT_FOUND", message: "SERIES_NOT_FOUND" });
    }

    return { success: true };
  });

/**
 * Update a genre.
 * Admin only.
 */
export const updateGenreProcedure = adminProcedure
  .input(
    z.object({
      genreId: z.string().min(1),
      name: entityNameSchema,
    }),
  )
  .mutation(async ({ input }) => {
    const trimmedName = input.name.trim();

    const existing = await prisma.genre.findUnique({
      where: { id: input.genreId },
      select: { id: true },
    });

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "GENRE_NOT_FOUND" });
    }

    const duplicate = await prisma.genre.findFirst({
      where: {
        name: trimmedName,
        id: { not: input.genreId },
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new TRPCError({ code: "CONFLICT", message: "GENRE_ALREADY_EXISTS" });
    }

    try {
      const slug = await generateUniqueSlug(trimmedName, async (candidate) => {
        const existingBySlug = await prisma.genre.findFirst({
          where: {
            slug: candidate,
            id: { not: input.genreId },
          },
          select: { id: true },
        });

        return Boolean(existingBySlug);
      });

      return prisma.genre.update({
        where: { id: input.genreId },
        data: {
          name: trimmedName,
          slug,
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });
    } catch (error) {
      const mappedError = mapEntityDuplicateError(error, "GENRE_ALREADY_EXISTS");

      if (mappedError) {
        throw mappedError;
      }

      throw error;
    }
  });

/**
 * Delete a genre.
 * Admin only.
 */
export const deleteGenreProcedure = adminProcedure
  .input(
    z.object({
      genreId: z.string().min(1),
    }),
  )
  .mutation(async ({ input }) => {
    const deleted = await prisma.genre.deleteMany({
      where: { id: input.genreId },
    });

    if (!deleted.count) {
      throw new TRPCError({ code: "NOT_FOUND", message: "GENRE_NOT_FOUND" });
    }

    return { success: true };
  });

/**
 * Update a publisher.
 * Admin only.
 */
export const updatePublisherProcedure = adminProcedure
  .input(
    z.object({
      publisherId: z.string().min(1),
      name: entityNameSchema,
    }),
  )
  .mutation(async ({ input }) => {
    const trimmedName = input.name.trim();

    const existing = await prisma.publisher.findUnique({
      where: { id: input.publisherId },
      select: { id: true },
    });

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "PUBLISHER_NOT_FOUND" });
    }

    const duplicate = await prisma.publisher.findFirst({
      where: {
        name: trimmedName,
        id: { not: input.publisherId },
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new TRPCError({ code: "CONFLICT", message: "PUBLISHER_ALREADY_EXISTS" });
    }

    try {
      const slug = await generateUniqueSlug(trimmedName, async (candidate) => {
        const existingBySlug = await prisma.publisher.findFirst({
          where: {
            slug: candidate,
            id: { not: input.publisherId },
          },
          select: { id: true },
        });

        return Boolean(existingBySlug);
      });

      return prisma.publisher.update({
        where: { id: input.publisherId },
        data: {
          name: trimmedName,
          slug,
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });
    } catch (error) {
      const mappedError = mapEntityDuplicateError(error, "PUBLISHER_ALREADY_EXISTS");

      if (mappedError) {
        throw mappedError;
      }

      throw error;
    }
  });

/**
 * Delete a publisher.
 * Admin only.
 */
export const deletePublisherProcedure = adminProcedure
  .input(
    z.object({
      publisherId: z.string().min(1),
    }),
  )
  .mutation(async ({ input }) => {
    const deleted = await prisma.publisher.deleteMany({
      where: { id: input.publisherId },
    });

    if (!deleted.count) {
      throw new TRPCError({ code: "NOT_FOUND", message: "PUBLISHER_NOT_FOUND" });
    }

    return { success: true };
  });
