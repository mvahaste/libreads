import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { mapUniqueConstraintError } from "@/lib/trpc/error-mappers";
import { protectedProcedure } from "@/lib/trpc/init";
import { TRPCError } from "@trpc/server";
import z from "zod/v4";

import { setBookTagRefSchema, tagNameSchema } from "../shared";

/**
 * Update an existing tag of the current user.
 */
export const updateTagProcedure = protectedProcedure
  .input(
    z.object({
      tagId: z.string(),
      name: tagNameSchema,
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;

    const existing = await prisma.tag.findUnique({
      where: { id: input.tagId },
      select: { id: true, userId: true },
    });

    if (!existing || existing.userId !== userId) {
      throw new TRPCError({ code: "NOT_FOUND", message: "TAG_NOT_FOUND" });
    }

    try {
      const updated = await prisma.tag.update({
        where: { id: input.tagId },
        data: {
          name: input.name.trim(),
        },
        select: { id: true, name: true },
      });

      return updated;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const mappedError = mapUniqueConstraintError(error, {
          userId_name: "TAG_ALREADY_EXISTS",
          name: "TAG_ALREADY_EXISTS",
        });

        if (mappedError) {
          throw mappedError;
        }
      }

      throw error;
    }
  });

/**
 * Delete a tag of the current user.
 */
export const deleteTagProcedure = protectedProcedure
  .input(z.object({ tagId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;

    const deleted = await prisma.tag.deleteMany({
      where: {
        id: input.tagId,
        userId,
      },
    });

    if (!deleted.count) {
      throw new TRPCError({ code: "NOT_FOUND", message: "TAG_NOT_FOUND" });
    }

    return { success: true };
  });

/**
 * Replace tags assigned to a book in the current user's library.
 */
export const setBookTagsProcedure = protectedProcedure
  .input(
    z.object({
      bookId: z.string(),
      tags: z.array(setBookTagRefSchema).default([]),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;

    const userBook = await prisma.userBook.findUnique({
      where: { userId_bookId: { userId, bookId: input.bookId } },
      select: { id: true },
    });

    if (!userBook) {
      throw new TRPCError({ code: "NOT_FOUND", message: "BOOK_NOT_IN_LIBRARY" });
    }

    const uniqueExistingTagIds = [...new Set(input.tags.filter((tag) => tag.mode === "existing").map((tag) => tag.id))];
    const createNamesByKey = new Map<string, string>();

    for (const tag of input.tags) {
      if (tag.mode !== "create") {
        continue;
      }

      const trimmedName = tag.name.trim();
      const normalizedName = trimmedName.toLowerCase();

      if (!createNamesByKey.has(normalizedName)) {
        createNamesByKey.set(normalizedName, trimmedName);
      }
    }

    const createTagNames = [...createNamesByKey.values()];

    const count = await prisma.$transaction(async (tx) => {
      let availableExistingTagIds: string[] = [];
      if (uniqueExistingTagIds.length > 0) {
        const availableTags = await tx.tag.findMany({
          where: {
            userId,
            id: { in: uniqueExistingTagIds },
          },
          select: { id: true },
        });

        if (availableTags.length !== uniqueExistingTagIds.length) {
          throw new TRPCError({ code: "FORBIDDEN", message: "INVALID_TAGS" });
        }

        availableExistingTagIds = availableTags.map((tag) => tag.id);
      }

      let createdTagIds: string[] = [];
      if (createTagNames.length > 0) {
        const createdOrExistingTags = await Promise.all(
          createTagNames.map((name) =>
            tx.tag.upsert({
              where: {
                userId_name: {
                  userId,
                  name,
                },
              },
              create: {
                userId,
                name,
              },
              update: {},
              select: { id: true },
            }),
          ),
        );

        createdTagIds = createdOrExistingTags.map((tag) => tag.id);
      }

      const finalTagIds = [...new Set([...availableExistingTagIds, ...createdTagIds])];

      await tx.tagBook.deleteMany({
        where: { userBookId: userBook.id },
      });

      if (finalTagIds.length > 0) {
        await tx.tagBook.createMany({
          data: finalTagIds.map((tagId) => ({
            tagId,
            userBookId: userBook.id,
          })),
        });
      }

      await tx.tag.deleteMany({
        where: {
          userId,
          entries: { none: {} },
        },
      });

      return finalTagIds.length;
    });

    return { count };
  });
