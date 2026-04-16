import z from "zod/v4";

import { AUTH } from "./constants";
import { normalizeAndValidateIsbn10, normalizeAndValidateIsbn13 } from "./utils/isbn";

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

function createNullableIsbnString(normalize: (value: string) => string | null, invalidMessage: string, maxLength = 64) {
  return z
    .string()
    .max(maxLength)
    .transform((value) => value.trim())
    .nullable()
    .refine((value) => value === null || value.length === 0 || normalize(value) !== null, {
      message: invalidMessage,
    })
    .transform((value) => {
      if (value === null || value.length === 0) {
        return null;
      }

      return normalize(value);
    });
}

const nullableIsbn10String = createNullableIsbnString(normalizeAndValidateIsbn10, "Invalid ISBN-10 format or checksum");

const nullableIsbn13String = createNullableIsbnString(normalizeAndValidateIsbn13, "Invalid ISBN-13 format or checksum");

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
  isbn10: nullableIsbn10String,
  isbn13: nullableIsbn13String,
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
