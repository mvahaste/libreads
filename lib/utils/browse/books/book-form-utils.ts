import type { BookDetailsOutput } from "@/lib/trpc/routers/books";
import { formatDurationForInput, parseDurationInputToSeconds } from "@/lib/utils/duration";
import z from "zod/v4";

import {
  type ParsedRelationRef,
  type RelationRefPrefixes,
  encodeCreateRelationRef,
  encodeExistingRelationRef as encodeExistingRelationRefValue,
  normalizeEntityName,
  parseRelationRef as parseRelationRefValue,
} from "./relation-ref-utils";

export { normalizeEntityName };

export const BOOK_TYPES = ["PHYSICAL", "EBOOK", "AUDIOBOOK"] as const;

const RELATION_REF_PREFIXES: RelationRefPrefixes = {
  existing: "existing:",
  create: "create:",
};

export type RelationOption = {
  id: string;
  name: string;
  slug: string;
};

export type UniqueConflictInput = {
  hardcoverId: number | null;
  isbn10: string | null;
  isbn13: string | null;
};

export function createEditBookSchema(titleRequired: string) {
  return z.object({
    title: z.string().trim().min(1, titleRequired).max(512),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    publishYear: z.string().optional(),
    hardcoverId: z.string().optional(),
    format: z.string().optional(),
    type: z.enum(BOOK_TYPES),
    pageCount: z.string().optional(),
    audioSeconds: z
      .string()
      .regex(/^\d+:[0-5]\d:[0-5]\d$/, "Duration must be in HH:MM:SS format")
      .or(z.literal(""))
      .optional(),
    isbn10: z.string().optional(),
    isbn13: z.string().optional(),
    coverId: z.string().nullable(),
    publisherRef: z.string().optional(),
    authorRefs: z.array(z.string()),
    genreRefs: z.array(z.string()),
    seriesEntries: z.array(
      z.object({
        seriesRef: z.string().optional(),
        position: z.string().optional(),
      }),
    ),
  });
}

export type EditBookFormValues = z.infer<ReturnType<typeof createEditBookSchema>>;

export function toNullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseNullableInteger(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);

  return Number.isNaN(parsed) ? null : parsed;
}

export function encodeExistingRelationRef(id: string): string {
  return encodeExistingRelationRefValue(id, RELATION_REF_PREFIXES);
}

export function parseRelationRef(value: string | null | undefined): ParsedRelationRef {
  return parseRelationRefValue(value, RELATION_REF_PREFIXES, true);
}

export function currentValuePlaceholder(value: string | number | null | undefined, fallback: string): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  const textValue = String(value).trim();

  return textValue.length > 0 ? textValue : fallback;
}

export function mergeOptionsWithSelected(options: RelationOption[], selected: RelationOption[]): RelationOption[] {
  const map = new Map<string, RelationOption>();

  for (const option of options) {
    map.set(option.id, option);
  }

  for (const option of selected) {
    if (!map.has(option.id)) {
      map.set(option.id, option);
    }
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function toLowercaseNameSet(options: RelationOption[]) {
  return new Set(options.map((option) => normalizeEntityName(option.name)));
}

export function buildUniqueConflictInput(values: {
  hardcoverId: string;
  isbn10: string;
  isbn13: string;
}): UniqueConflictInput {
  return {
    hardcoverId: parseNullableInteger(values.hardcoverId),
    isbn10: toNullableText(values.isbn10),
    isbn13: toNullableText(values.isbn13),
  };
}

export function resolveRelationLabel(value: string, existingById: Map<string, string>): string {
  const parsed = parseRelationRef(value);

  if (!parsed) {
    return "";
  }

  if (parsed.mode === "create") {
    return parsed.name;
  }

  return existingById.get(parsed.id) ?? "";
}

export function buildCreatableItems(existingRefs: string[], query: string, takenNames: Set<string>) {
  const normalizedQuery = normalizeEntityName(query);
  const canCreate = normalizedQuery.length > 0 && !takenNames.has(normalizedQuery);
  const createValue = canCreate ? encodeCreateRelationRef(query, RELATION_REF_PREFIXES) : null;

  return {
    items: createValue ? [createValue, ...existingRefs] : existingRefs,
    createValue,
  };
}

export function dedupeRelationRefValues(values: string[], resolveLabel: (value: string) => string): string[] {
  const dedupedByName = new Map<string, string>();

  for (const value of values) {
    const parsed = parseRelationRef(value);

    if (!parsed) {
      continue;
    }

    const label = resolveLabel(value);
    const normalizedLabel = normalizeEntityName(label);

    if (!normalizedLabel) {
      continue;
    }

    const existing = dedupedByName.get(normalizedLabel);

    if (!existing) {
      dedupedByName.set(normalizedLabel, value);
      continue;
    }

    const existingParsed = parseRelationRef(existing);

    if (existingParsed?.mode === "create" && parsed.mode === "existing") {
      dedupedByName.set(normalizedLabel, value);
    }
  }

  return [...dedupedByName.values()];
}

export function getDefaultValues(book: BookDetailsOutput): EditBookFormValues {
  return {
    title: book.title,
    subtitle: book.subtitle ?? "",
    description: book.description ?? "",
    publishYear: book.publishYear?.toString() ?? "",
    hardcoverId: book.hardcoverId?.toString() ?? "",
    format: book.format ?? "",
    type: book.type,
    pageCount: book.pageCount?.toString() ?? "",
    audioSeconds: book.audioSeconds != null ? formatDurationForInput(book.audioSeconds) : "",
    isbn10: book.isbn10 ?? "",
    isbn13: book.isbn13 ?? "",
    coverId: book.coverId,
    publisherRef: book.publisher?.id ? encodeExistingRelationRef(book.publisher.id) : "",
    authorRefs: book.authors.map((author) => encodeExistingRelationRef(author.id)),
    genreRefs: book.genres.map((genre) => encodeExistingRelationRef(genre.id)),
    seriesEntries: book.series.map((series) => ({
      seriesRef: encodeExistingRelationRef(series.id),
      position: series.position != null ? String(series.position) : "",
    })),
  };
}

export function getCreateDefaultValues(initialValues?: Partial<EditBookFormValues>): EditBookFormValues {
  return {
    title: initialValues?.title ?? "",
    subtitle: initialValues?.subtitle ?? "",
    description: initialValues?.description ?? "",
    publishYear: initialValues?.publishYear ?? "",
    hardcoverId: initialValues?.hardcoverId ?? "",
    format: initialValues?.format ?? "",
    type: initialValues?.type ?? "PHYSICAL",
    pageCount: initialValues?.pageCount ?? "",
    audioSeconds: initialValues?.audioSeconds ?? "",
    isbn10: initialValues?.isbn10 ?? "",
    isbn13: initialValues?.isbn13 ?? "",
    coverId: initialValues?.coverId ?? null,
    publisherRef: initialValues?.publisherRef ?? "",
    authorRefs: initialValues?.authorRefs ?? [],
    genreRefs: initialValues?.genreRefs ?? [],
    seriesEntries: initialValues?.seriesEntries ?? [],
  };
}

type RelationInput = { mode: "existing"; id: string } | { mode: "create"; name: string };

export interface BookMutationInput {
  title: string;
  subtitle: string | null;
  description: string | null;
  publishYear: number | null;
  hardcoverId: number | null;
  type: "PHYSICAL" | "EBOOK" | "AUDIOBOOK";
  format: string | null;
  pageCount: number | null;
  audioSeconds: number | null;
  isbn10: string | null;
  isbn13: string | null;
  publisher: RelationInput | null;
  authors: RelationInput[];
  genres: RelationInput[];
  series: Array<{
    series: RelationInput;
    position: number | null;
  }>;
  coverId: string | null;
}

export type CreateBookMutationInput = BookMutationInput;

export interface UpdateBookMutationInput extends BookMutationInput {
  bookId: string;
}

export type BuildBookMutationInputError = {
  field: "audioSeconds" | `seriesEntries.${number}.position`;
  message: string;
};

export type BuildUpdateBookMutationInputError = BuildBookMutationInputError;

interface BuildUpdateBookMutationInputArgs {
  bookId: string;
  values: EditBookFormValues;
  authorsById: Map<string, string>;
  genresById: Map<string, string>;
  messages: {
    durationFormatError: string;
    seriesPositionError: string;
  };
}

interface BuildCreateBookMutationInputArgs {
  values: EditBookFormValues;
  authorsById: Map<string, string>;
  genresById: Map<string, string>;
  messages: {
    durationFormatError: string;
    seriesPositionError: string;
  };
}

function buildBookMutationInput({
  values,
  authorsById,
  genresById,
  messages,
}: BuildCreateBookMutationInputArgs): { input: BookMutationInput } | { error: BuildBookMutationInputError } {
  const isAudiobook = values.type === "AUDIOBOOK";

  const parsedAudioSeconds = isAudiobook
    ? values.audioSeconds
      ? parseDurationInputToSeconds(values.audioSeconds)
      : null
    : null;

  if (isAudiobook && values.audioSeconds && parsedAudioSeconds === null) {
    return {
      error: {
        field: "audioSeconds",
        message: messages.durationFormatError,
      },
    };
  }

  const parsedPageCount = isAudiobook ? null : parseNullableInteger(values.pageCount ?? "");

  const publisherParsed = parseRelationRef(values.publisherRef);
  const publisher = publisherParsed
    ? publisherParsed.mode === "create"
      ? ({ mode: "create", name: publisherParsed.name } as const)
      : ({ mode: "existing", id: publisherParsed.id } as const)
    : null;

  const authorRefs = dedupeRelationRefValues(values.authorRefs, (value) => resolveRelationLabel(value, authorsById))
    .map((value) => parseRelationRef(value))
    .filter((value): value is Exclude<ParsedRelationRef, null> => Boolean(value))
    .map((value) =>
      value.mode === "create"
        ? ({ mode: "create", name: value.name } as const)
        : ({ mode: "existing", id: value.id } as const),
    );

  const genreRefs = dedupeRelationRefValues(values.genreRefs, (value) => resolveRelationLabel(value, genresById))
    .map((value) => parseRelationRef(value))
    .filter((value): value is Exclude<ParsedRelationRef, null> => Boolean(value))
    .map((value) =>
      value.mode === "create"
        ? ({ mode: "create", name: value.name } as const)
        : ({ mode: "existing", id: value.id } as const),
    );

  const seriesEntries: {
    series: { mode: "existing"; id: string } | { mode: "create"; name: string };
    position: number | null;
  }[] = [];

  for (let index = 0; index < values.seriesEntries.length; index += 1) {
    const entry = values.seriesEntries[index];
    const parsedSeriesRef = parseRelationRef(entry.seriesRef);

    if (!parsedSeriesRef) {
      continue;
    }

    const positionRaw = entry.position?.trim() ?? "";
    let parsedPosition: number | null = null;

    if (positionRaw.length > 0) {
      const parsed = Number(positionRaw);

      if (!Number.isFinite(parsed) || parsed <= 0) {
        return {
          error: {
            field: `seriesEntries.${index}.position`,
            message: messages.seriesPositionError,
          },
        };
      }

      parsedPosition = parsed;
    }

    seriesEntries.push({
      series:
        parsedSeriesRef.mode === "create"
          ? ({ mode: "create", name: parsedSeriesRef.name } as const)
          : ({ mode: "existing", id: parsedSeriesRef.id } as const),
      position: parsedPosition,
    });
  }

  return {
    input: {
      title: values.title.trim(),
      subtitle: toNullableText(values.subtitle ?? ""),
      description: toNullableText(values.description ?? ""),
      publishYear: parseNullableInteger(values.publishYear ?? ""),
      hardcoverId: parseNullableInteger(values.hardcoverId ?? ""),
      type: values.type,
      format: toNullableText(values.format ?? ""),
      pageCount: parsedPageCount,
      audioSeconds: parsedAudioSeconds,
      isbn10: toNullableText(values.isbn10 ?? ""),
      isbn13: toNullableText(values.isbn13 ?? ""),
      publisher,
      authors: authorRefs,
      genres: genreRefs,
      series: seriesEntries,
      coverId: values.coverId,
    },
  };
}

export function buildCreateBookMutationInput({
  values,
  authorsById,
  genresById,
  messages,
}: BuildCreateBookMutationInputArgs):
  | { input: CreateBookMutationInput }
  | {
      error: BuildBookMutationInputError;
    } {
  return buildBookMutationInput({
    values,
    authorsById,
    genresById,
    messages,
  });
}

export function buildUpdateBookMutationInput({
  bookId,
  values,
  authorsById,
  genresById,
  messages,
}: BuildUpdateBookMutationInputArgs):
  | { input: UpdateBookMutationInput }
  | {
      error: BuildBookMutationInputError;
    } {
  const buildResult = buildBookMutationInput({
    values,
    authorsById,
    genresById,
    messages,
  });

  if ("error" in buildResult) {
    return buildResult;
  }

  return {
    input: {
      bookId,
      ...buildResult.input,
    },
  };
}
