import { groupSeriesBooks } from "@/lib/utils/browse/series/group-series-books";
import { describe, expect, test } from "vitest";

describe("groupSeriesBooks", () => {
  test("groups equal non-null positions and keeps null positions separate", () => {
    const grouped = groupSeriesBooks([
      {
        position: null,
        book: {
          id: "book-a",
          slug: "book-a",
          title: "Book A",
          subtitle: null,
          coverId: null,
          publishYear: 2001,
          authors: ["Author A"],
        },
      },
      {
        position: 2,
        book: {
          id: "book-b",
          slug: "book-b",
          title: "Book B",
          subtitle: null,
          coverId: null,
          publishYear: 2002,
          authors: ["Author B"],
        },
      },
      {
        position: 2,
        book: {
          id: "book-c",
          slug: "book-c",
          title: "Book C",
          subtitle: null,
          coverId: null,
          publishYear: 2003,
          authors: ["Author C"],
        },
      },
      {
        position: null,
        book: {
          id: "book-d",
          slug: "book-d",
          title: "Book D",
          subtitle: null,
          coverId: null,
          publishYear: 2004,
          authors: ["Author D"],
        },
      },
    ]);

    expect(grouped).toHaveLength(3);
    expect(grouped[0]).toMatchObject({ groupKey: "null:book-a", position: null, books: [{ id: "book-a" }] });
    expect(grouped[1]).toMatchObject({
      groupKey: "position:2",
      position: 2,
      books: [{ id: "book-b" }, { id: "book-c" }],
    });
    expect(grouped[2]).toMatchObject({ groupKey: "null:book-d", position: null, books: [{ id: "book-d" }] });
  });

  test("treats zero as a valid non-null group position", () => {
    const grouped = groupSeriesBooks([
      {
        position: 0,
        book: {
          id: "book-zero-1",
          slug: "book-zero-1",
          title: "Book Zero 1",
          subtitle: null,
          coverId: null,
          publishYear: null,
          authors: [],
        },
      },
      {
        position: 0,
        book: {
          id: "book-zero-2",
          slug: "book-zero-2",
          title: "Book Zero 2",
          subtitle: null,
          coverId: null,
          publishYear: null,
          authors: [],
        },
      },
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]).toMatchObject({
      groupKey: "position:0",
      position: 0,
      books: [{ id: "book-zero-1" }, { id: "book-zero-2" }],
    });
  });
});
