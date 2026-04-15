import z from "zod/v4";

import { AUTH } from "./constants";

export const createUserSchema = z.object({
  name: z
    .string()
    .min(AUTH.NAME_MIN_LENGTH)
    .max(AUTH.NAME_MAX_LENGTH)
    .transform((str) => str.trim()),
  email: z.email(),
  password: z.string().min(AUTH.PASSWORD_MIN_LENGTH).max(AUTH.PASSWORD_MAX_LENGTH),
});

export type CreateUserData = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().trim().min(AUTH.NAME_MIN_LENGTH).max(AUTH.NAME_MAX_LENGTH).optional(),
  email: z.email().optional(),
});

export type UpdateUserData = z.infer<typeof updateUserSchema>;

export const importBookSchema = z.object({
  editionId: z.int().nonnegative(),
});

const relationRefSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("existing"),
    id: z.string().min(1),
  }),
  z.object({
    mode: z.literal("create"),
    name: z.string().trim().min(1).max(160),
  }),
]);

const nullableTrimmedString = (maxLength: number) =>
  z
    .string()
    .max(maxLength)
    .transform((value) => value.trim())
    .nullable();

const bookTypeSchema = z.enum(["PHYSICAL", "EBOOK", "AUDIOBOOK"]);

const bookWriteSchema = z.object({
  title: z.string().trim().min(1).max(512),
  subtitle: nullableTrimmedString(512),
  description: nullableTrimmedString(12_000),
  publishYear: z.int().min(1).max(9999).nullable(),
  type: bookTypeSchema,
  format: nullableTrimmedString(120),
  pageCount: z.int().min(1).max(100_000).nullable(),
  audioSeconds: z.int().min(0).max(31_557_600).nullable(),
  isbn10: nullableTrimmedString(32),
  isbn13: nullableTrimmedString(32),
  hardcoverId: z.int().nonnegative().nullable(),
  publisher: relationRefSchema.nullable().optional(),
  authors: z.array(relationRefSchema).optional(),
  genres: z.array(relationRefSchema).optional(),
  series: z
    .array(
      z.object({
        series: relationRefSchema,
        position: z.number().positive().max(10_000).nullable(),
      }),
    )
    .optional(),
  coverId: z.string().min(1).nullable().optional(),
});

export const createBookSchema = bookWriteSchema;

export const updateBookSchema = bookWriteSchema.extend({
  bookId: z.string().min(1),
});

export const bookUniqueConflictSchema = z.object({
  excludeBookId: z.string().min(1).optional(),
  hardcoverId: z.int().nonnegative().nullable(),
  isbn10: z.string().nullable(),
  isbn13: z.string().nullable(),
});

export type CreateBookData = z.infer<typeof createBookSchema>;
export type UpdateBookData = z.infer<typeof updateBookSchema>;
