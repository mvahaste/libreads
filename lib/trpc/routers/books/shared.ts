import { Prisma } from "@/generated/prisma/client";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import z from "zod/v4";

export { readingStatusFilterSchema } from "@/lib/books/reading-status";

/** Shared input schema for paginated, searchable, sortable list endpoints */
export const listInput = z.object({
  page: z.int().min(1).default(1),
  pageSize: z.int().min(1).max(100).default(DEFAULT_PAGE_SIZE),
  search: z.string().default(""),
  sort: z.string().default(""),
});

/** Helper to compute skip/take from page/pageSize */
export function paginate(page: number, pageSize: number) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

/** Parse a sort string like "title-asc" into field and direction */
export function parseSort(sort: string): { field: string; dir: "asc" | "desc" } | null {
  if (!sort) return null;

  const lastDash = sort.lastIndexOf("-");

  if (lastDash === -1) return null;

  const field = sort.slice(0, lastDash);

  const dir = sort.slice(lastDash + 1);

  if (dir !== "asc" && dir !== "desc") return null;

  return { field, dir };
}

/** Build a Prisma orderBy from a sort string, given a mapping of allowed field names to Prisma orderBy objects */
export function buildOrderBy<T>(sort: string, fieldMap: Record<string, (dir: "asc" | "desc") => T>, fallback: T): T {
  const parsed = parseSort(sort);

  if (!parsed) return fallback;

  const builder = fieldMap[parsed.field];

  return builder ? builder(parsed.dir) : fallback;
}

/** Shared book filter -> Prisma where clause builder */
export function buildBookWhereInput(filters: {
  search?: string;
  genre?: string;
  author?: string;
  publisher?: string;
  series?: string;
  format?: string;
}): Prisma.BookWhereInput {
  const { search, genre, author, publisher, series, format } = filters;
  return {
    ...(search
      ? {
          OR: [
            { title: { contains: search } },
            { authors: { some: { author: { name: { contains: search } } } } },
            { isbn13: { contains: search } },
            { isbn10: { contains: search } },
          ],
        }
      : {}),
    ...(genre ? { genres: { some: { genre: { slug: genre } } } } : {}),
    ...(author ? { authors: { some: { author: { slug: author } } } } : {}),
    ...(publisher ? { publisher: { slug: publisher } } : {}),
    ...(series ? { series: { some: { series: { slug: series } } } } : {}),
    ...(format ? { format: format } : {}),
  };
}

/** Shared edition sort field mapping */
export const editionSortFields: Record<string, (dir: "asc" | "desc") => Prisma.BookOrderByWithRelationInput> = {
  title: (dir) => ({ title: dir }),
  year: (dir) => ({ publishYear: dir }),
};

export const tagNameSchema = z.string().trim().min(1).max(64);
export const setBookTagRefSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("existing"),
    id: z.string().min(1),
  }),
  z.object({
    mode: z.literal("create"),
    name: tagNameSchema,
  }),
]);
