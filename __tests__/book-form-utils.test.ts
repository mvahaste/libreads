import {
  type EditBookFormValues,
  buildCreateBookMutationInput,
  buildUpdateBookMutationInput,
  createEditBookSchema,
  dedupeRelationRefValues,
  encodeExistingRelationRef,
  getCreateDefaultValues,
  parseRelationRef,
  resolveRelationLabel,
} from "@/lib/utils/browse/books/book-form-utils";
import { describe, expect, test } from "vitest";

function makeValues(overrides: Partial<EditBookFormValues> = {}): EditBookFormValues {
  return {
    ...getCreateDefaultValues(),
    title: "Book Title",
    ...overrides,
  };
}

const messages = {
  durationFormatError: "Invalid duration",
  seriesPositionError: "Invalid series position",
};

const schemaMessages = {
  titleRequired: "Title is required",
  isbn10Invalid: "ISBN-10 is invalid",
  isbn13Invalid: "ISBN-13 is invalid",
};

describe("parseRelationRef", () => {
  test("parses existing and create relation refs", () => {
    expect(parseRelationRef("existing:author-1")).toEqual({ mode: "existing", id: "author-1" });
    expect(parseRelationRef("create:Author Name")).toEqual({ mode: "create", name: "Author Name" });
  });

  test("treats plain values as existing ids and ignores empty values", () => {
    expect(parseRelationRef("author-1")).toEqual({ mode: "existing", id: "author-1" });
    expect(parseRelationRef("  ")).toBeNull();
    expect(parseRelationRef(null)).toBeNull();
  });
});

describe("dedupeRelationRefValues", () => {
  test("prefers existing refs over create refs when labels match", () => {
    const existingAuthorRef = encodeExistingRelationRef("author-1");
    const refs = ["create:Alice", existingAuthorRef];
    const authorsById = new Map<string, string>([["author-1", "Alice"]]);

    const deduped = dedupeRelationRefValues(refs, (value) => resolveRelationLabel(value, authorsById));

    expect(deduped).toEqual([existingAuthorRef]);
  });
});

describe("book mutation input builders", () => {
  test("createEditBookSchema validates ISBN format and checksum", () => {
    const schema = createEditBookSchema(schemaMessages);

    const validResult = schema.safeParse(
      makeValues({
        isbn10: "0-8044-2957-x",
        isbn13: "ISBN 978-0-306-40615-7",
      }),
    );

    expect(validResult.success).toBe(true);

    const invalidIsbn10Result = schema.safeParse(
      makeValues({
        isbn10: "0306406153",
      }),
    );

    expect(invalidIsbn10Result.success).toBe(false);

    if (invalidIsbn10Result.success) {
      throw new Error("Expected invalid ISBN-10 validation failure");
    }

    expect(invalidIsbn10Result.error.issues[0]?.message).toBe("ISBN-10 is invalid");

    const invalidIsbn13Result = schema.safeParse(
      makeValues({
        isbn13: "9780306406158",
      }),
    );

    expect(invalidIsbn13Result.success).toBe(false);

    if (invalidIsbn13Result.success) {
      throw new Error("Expected invalid ISBN-13 validation failure");
    }

    expect(invalidIsbn13Result.error.issues[0]?.message).toBe("ISBN-13 is invalid");
  });

  test("buildCreateBookMutationInput trims fields and converts relation refs", () => {
    const existingAuthorRef = encodeExistingRelationRef("author-1");
    const existingGenreRef = encodeExistingRelationRef("genre-1");

    const result = buildCreateBookMutationInput({
      values: makeValues({
        title: "  My Book  ",
        subtitle: "  Subtitle  ",
        isbn10: "0-8044-2957-x",
        isbn13: "ISBN 978-0-306-40615-7",
        publisherRef: "create:My Publisher",
        authorRefs: ["create:Alice", existingAuthorRef],
        genreRefs: [existingGenreRef],
        seriesEntries: [{ seriesRef: "create:My Saga", position: "2.5" }],
      }),
      authorsById: new Map([["author-1", "Alice"]]),
      genresById: new Map([["genre-1", "Fantasy"]]),
      messages,
    });

    if ("error" in result) {
      throw new Error("Expected successful input build");
    }

    expect(result.input.title).toBe("My Book");
    expect(result.input.subtitle).toBe("Subtitle");
    expect(result.input.isbn10).toBe("080442957X");
    expect(result.input.isbn13).toBe("9780306406157");
    expect(result.input.publisher).toEqual({ mode: "create", name: "My Publisher" });
    expect(result.input.authors).toEqual([{ mode: "existing", id: "author-1" }]);
    expect(result.input.genres).toEqual([{ mode: "existing", id: "genre-1" }]);
    expect(result.input.series).toEqual([{ series: { mode: "create", name: "My Saga" }, position: 2.5 }]);
  });

  test("buildCreateBookMutationInput validates audiobook duration", () => {
    const result = buildCreateBookMutationInput({
      values: makeValues({
        type: "AUDIOBOOK",
        audioSeconds: "01:99:00",
      }),
      authorsById: new Map(),
      genresById: new Map(),
      messages,
    });

    expect(result).toEqual({
      error: {
        field: "audioSeconds",
        message: "Invalid duration",
      },
    });
  });

  test("buildCreateBookMutationInput validates series position", () => {
    const result = buildCreateBookMutationInput({
      values: makeValues({
        seriesEntries: [{ seriesRef: "create:Series", position: "0" }],
      }),
      authorsById: new Map(),
      genresById: new Map(),
      messages,
    });

    expect(result).toEqual({
      error: {
        field: "seriesEntries.0.position",
        message: "Invalid series position",
      },
    });
  });

  test("buildUpdateBookMutationInput includes bookId", () => {
    const result = buildUpdateBookMutationInput({
      bookId: "book-1",
      values: makeValues(),
      authorsById: new Map(),
      genresById: new Map(),
      messages,
    });

    if ("error" in result) {
      throw new Error("Expected successful update input build");
    }

    expect(result.input.bookId).toBe("book-1");
    expect(result.input.title).toBe("Book Title");
  });
});
