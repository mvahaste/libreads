import { extractMainGenres } from "@/lib/books/extract-main-genres";
import { describe, expect, test } from "vitest";

const EXAMPLE_TAGS = [
  { tag: { id: 1, tag: "Classics", tag_category_id: 1, count: 83298 } },
  { tag: { id: 3, tag: "Young Adult", tag_category_id: 1, count: 149364 } },
  { tag: { id: 4, tag: "Adventure", tag_category_id: 1, count: 105875 } },
  { tag: { id: 6, tag: "Science Fiction", tag_category_id: 1, count: 101064 } },
  { tag: { id: 20, tag: "Comics", tag_category_id: 1, count: 75389 } },
  { tag: { id: 24, tag: "Children", tag_category_id: 1, count: 2996 } },
  { tag: { id: 190, tag: "challenging", tag_category_id: 4, count: 19280 } },
  { tag: { id: 194, tag: "Character driven", tag_category_id: 2, count: 29889 } },
  { tag: { id: 199, tag: "Violence", tag_category_id: 3, count: 3064 } },
  { tag: { id: 203, tag: "informative", tag_category_id: 4, count: 14440 } },
  { tag: { id: 182, tag: "medium", tag_category_id: 37, count: 58278 } },
  { tag: { id: 208, tag: "Plot driven", tag_category_id: 2, count: 17030 } },
  { tag: { id: 2450, tag: "Audible", tag_category_id: 2, count: 392 } },
  { tag: { id: 188, tag: "fast", tag_category_id: 37, count: 41035 } },
  { tag: { id: 206, tag: "tense", tag_category_id: 4, count: 35112 } },
  { tag: { id: 16793, tag: "Science Fiction & Fantasy", tag_category_id: 1, count: 1982 } },
  { tag: { id: 207, tag: "mysterious", tag_category_id: 4, count: 38535 } },
  { tag: { id: 2158, tag: "slow-paced", tag_category_id: 4, count: 446 } },
  { tag: { id: 148, tag: "dark", tag_category_id: 4, count: 44713 } },
  { tag: { id: 180, tag: "funny", tag_category_id: 4, count: 29693 } },
  { tag: { id: 25047, tag: "1735854681142", tag_category_id: 4, count: 1 } },
  { tag: { id: 195, tag: "slow", tag_category_id: 37, count: 17296 } },
  { tag: { id: 181, tag: "lighthearted", tag_category_id: 4, count: 23877 } },
  { tag: { id: 183, tag: "A mix driven", tag_category_id: 2, count: 38124 } },
  { tag: { id: 21, tag: "War", tag_category_id: 1, count: 40755 } },
  { tag: { id: 196, tag: "Not Diverse Characters", tag_category_id: 2, count: 39271 } },
  { tag: { id: 57, tag: "Death", tag_category_id: 3, count: 3634 } },
  { tag: { id: 2, tag: "Fantasy", tag_category_id: 1, count: 220100 } },
  { tag: { id: 5, tag: "Fiction", tag_category_id: 1, count: 231038 } },
  { tag: { id: 906, tag: "slow-paced", tag_category_id: 2, count: 381 } },
  { tag: { id: 272, tag: "War", tag_category_id: 3, count: 1024 } },
  { tag: { id: 240, tag: "inspiring", tag_category_id: 4, count: 15430 } },
  { tag: { id: 187, tag: "hopeful", tag_category_id: 4, count: 20560 } },
  { tag: { id: 191, tag: "emotional", tag_category_id: 4, count: 48533 } },
  { tag: { id: 186, tag: "Diverse Characters", tag_category_id: 2, count: 41444 } },
  { tag: { id: 185, tag: "Loveable Characters", tag_category_id: 2, count: 51534 } },
  { tag: { id: 184, tag: "Strong Character Development", tag_category_id: 2, count: 49369 } },
  { tag: { id: 193, tag: "sad", tag_category_id: 4, count: 22108 } },
  { tag: { id: 197, tag: "Unloveable Characters", tag_category_id: 2, count: 34618 } },
  { tag: { id: 189, tag: "Weak Character Development", tag_category_id: 2, count: 34713 } },
  { tag: { id: 154, tag: "Adventurous", tag_category_id: 4, count: 49436 } },
  { tag: { id: 16854, tag: "Epic", tag_category_id: 1, count: 634 } },
  { tag: { id: 32127, tag: "Series: The Wheel of Time", tag_category_id: 4, count: 5 } },
];

describe("extractMainGenres", () => {
  test("returns genres sorted by count descending", () => {
    const result = extractMainGenres(EXAMPLE_TAGS, 0.8, 3, 1);

    expect(result[0]).toEqual({ id: 5, name: "Fiction" });
    expect(result[1]).toEqual({ id: 2, name: "Fantasy" });
  });

  test("returns a compact set covering 80% of genre weight", () => {
    const result = extractMainGenres(EXAMPLE_TAGS, 0.8, 3, 1);

    expect(result).toHaveLength(3);
    expect(result.map((g) => g.name)).toEqual(["Fiction", "Fantasy", "Young Adult"]);
  });

  test("respects custom threshold", () => {
    const result = extractMainGenres(EXAMPLE_TAGS, 0.4, 3, 1);

    expect(result).toHaveLength(2);
    expect(result.map((g) => g.name)).toEqual(["Fiction", "Fantasy"]);
  });

  test("respects maxGenres cap", () => {
    const result = extractMainGenres(EXAMPLE_TAGS, 1.0, 3, 1);
    expect(result).toHaveLength(3);
  });

  test("returns empty array when no genre tags exist", () => {
    const nonGenreTags = EXAMPLE_TAGS.filter((t) => t.tag.tag_category_id !== 1);
    expect(extractMainGenres(nonGenreTags, 0.8, 3, 1)).toEqual([]);
  });

  test("returns empty array for empty input", () => {
    expect(extractMainGenres([], 0.8, 3, 1)).toEqual([]);
  });

  test("handles single genre tag", () => {
    const single = [{ tag: { id: 2, tag: "Fantasy", tag_category_id: 1, count: 100 } }];
    expect(extractMainGenres(single, 0.8, 3, 1)).toEqual([{ id: 2, name: "Fantasy" }]);
  });
});
