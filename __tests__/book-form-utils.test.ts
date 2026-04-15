import {
  type EditBookFormValues,
  buildCreateBookMutationInput,
  buildUpdateBookMutationInput,
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
  test("buildCreateBookMutationInput trims fields and converts relation refs", () => {
    const existingAuthorRef = encodeExistingRelationRef("author-1");
    const existingGenreRef = encodeExistingRelationRef("genre-1");

    const result = buildCreateBookMutationInput({
      values: makeValues({
        title: "  My Book  ",
        subtitle: "  Subtitle  ",
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
