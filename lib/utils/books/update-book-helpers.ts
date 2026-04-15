import { Prisma } from "@/generated/prisma/client";
import { mapUniqueConstraintError } from "@/lib/trpc/error-mappers";
import { generateUniqueSlug } from "@/lib/utils/slug";
import { updateBookSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import z from "zod/v4";

type UpdateBookInput = z.infer<typeof updateBookSchema>;
type RelationRefInput = Exclude<UpdateBookInput["publisher"], null | undefined>;
type SeriesUpdateInput = NonNullable<UpdateBookInput["series"]>[number];

export function normalizeNullableText(value: string | null): string | null {
  if (value === null) return null;

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export function getDetachedIds(previousIds: string[], nextIds: string[]): string[] {
  const nextIdSet = new Set(nextIds);

  return previousIds.filter((id) => !nextIdSet.has(id));
}

export function mapUpdateBookConflict(error: Prisma.PrismaClientKnownRequestError): TRPCError | null {
  return mapUniqueConstraintError(error, {
    slug: "BOOK_SLUG_EXISTS",
    hardcoverId: "BOOK_HARDCOVER_ID_EXISTS",
    isbn10: "BOOK_ISBN10_EXISTS",
    isbn13: "BOOK_ISBN13_EXISTS",
  });
}

type RelationResolverConfig = {
  invalidMessage: string;
  findById: (id: string) => Promise<{ id: string } | null>;
  findByName: (name: string) => Promise<{ id: string } | null>;
  slugExists: (slug: string) => Promise<boolean>;
  create: (name: string, slug: string) => Promise<{ id: string }>;
};

async function resolveRelationRef(ref: RelationRefInput, config: RelationResolverConfig): Promise<string> {
  if (ref.mode === "existing") {
    const existing = await config.findById(ref.id);

    if (!existing) {
      throw new TRPCError({ code: "BAD_REQUEST", message: config.invalidMessage });
    }

    return existing.id;
  }

  const existingByName = await config.findByName(ref.name);
  if (existingByName) {
    return existingByName.id;
  }

  const slug = await generateUniqueSlug(ref.name, async (value) => config.slugExists(value));
  const created = await config.create(ref.name, slug);

  return created.id;
}

export async function resolvePublisherRef(
  tx: Prisma.TransactionClient,
  publisher: RelationRefInput | null,
): Promise<string | null> {
  if (publisher === null) {
    return null;
  }

  return resolveRelationRef(publisher, {
    invalidMessage: "INVALID_PUBLISHER",
    findById: (id) =>
      tx.publisher.findUnique({
        where: { id },
        select: { id: true },
      }),
    findByName: (name) =>
      tx.publisher.findUnique({
        where: { name },
        select: { id: true },
      }),
    slugExists: async (slug) => !!(await tx.publisher.findUnique({ where: { slug } })),
    create: (name, slug) =>
      tx.publisher.create({
        data: {
          name,
          slug,
        },
        select: { id: true },
      }),
  });
}

export async function resolveAuthorRef(tx: Prisma.TransactionClient, author: RelationRefInput): Promise<string> {
  return resolveRelationRef(author, {
    invalidMessage: "INVALID_AUTHOR",
    findById: (id) =>
      tx.author.findUnique({
        where: { id },
        select: { id: true },
      }),
    findByName: (name) =>
      tx.author.findFirst({
        where: { name },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      }),
    slugExists: async (slug) => !!(await tx.author.findUnique({ where: { slug } })),
    create: (name, slug) =>
      tx.author.create({
        data: {
          name,
          slug,
        },
        select: { id: true },
      }),
  });
}

export async function resolveGenreRef(tx: Prisma.TransactionClient, genre: RelationRefInput): Promise<string> {
  return resolveRelationRef(genre, {
    invalidMessage: "INVALID_GENRE",
    findById: (id) =>
      tx.genre.findUnique({
        where: { id },
        select: { id: true },
      }),
    findByName: (name) =>
      tx.genre.findUnique({
        where: { name },
        select: { id: true },
      }),
    slugExists: async (slug) => !!(await tx.genre.findUnique({ where: { slug } })),
    create: (name, slug) =>
      tx.genre.create({
        data: {
          name,
          slug,
        },
        select: { id: true },
      }),
  });
}

export async function resolveSeriesRef(tx: Prisma.TransactionClient, series: RelationRefInput): Promise<string> {
  return resolveRelationRef(series, {
    invalidMessage: "INVALID_SERIES",
    findById: (id) =>
      tx.series.findUnique({
        where: { id },
        select: { id: true },
      }),
    findByName: (name) =>
      tx.series.findUnique({
        where: { name },
        select: { id: true },
      }),
    slugExists: async (slug) => !!(await tx.series.findUnique({ where: { slug } })),
    create: (name, slug) =>
      tx.series.create({
        data: {
          name,
          slug,
        },
        select: { id: true },
      }),
  });
}

export async function resolveUniqueRelationRefs(
  refs: RelationRefInput[],
  resolver: (ref: RelationRefInput) => Promise<string>,
): Promise<string[]> {
  const uniqueIds = new Set<string>();

  for (const ref of refs) {
    uniqueIds.add(await resolver(ref));
  }

  return [...uniqueIds];
}

export async function resolveSeriesEntries(tx: Prisma.TransactionClient, entries: SeriesUpdateInput[]) {
  const map = new Map<
    string,
    {
      seriesId: string;
      position: number | null;
    }
  >();

  for (const entry of entries) {
    const seriesId = await resolveSeriesRef(tx, entry.series);

    if (map.has(seriesId)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "DUPLICATE_SERIES_ENTRY" });
    }

    map.set(seriesId, {
      seriesId,
      position: entry.position,
    });
  }

  return [...map.values()];
}
