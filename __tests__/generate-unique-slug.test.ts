import { generateUniqueSlug } from "@/lib/utils/slug";
import { describe, expect, test } from "vitest";

describe("generateUniqueSlug", () => {
  test("generates a basic slug from a string", async () => {
    const slug = await generateUniqueSlug("My Book Title", async () => false);
    expect(slug).toBe("my-book-title");
  });

  test("handles special characters", async () => {
    const slug = await generateUniqueSlug("Café & Résumé!", async () => false);
    expect(slug).toBe("cafe-resume");
  });

  test("handles unicode characters", async () => {
    const slug = await generateUniqueSlug("Über Cool Böök", async () => false);
    expect(slug).toBe("uber-cool-book");
  });

  test("appends -1 when the base slug already exists", async () => {
    const existing = new Set(["my-book"]);
    const slug = await generateUniqueSlug("My Book", async (s) => existing.has(s));
    expect(slug).toBe("my-book-1");
  });

  test("appends incrementing numbers for multiple collisions", async () => {
    const existing = new Set(["my-book", "my-book-1", "my-book-2"]);
    const slug = await generateUniqueSlug("My Book", async (s) => existing.has(s));
    expect(slug).toBe("my-book-3");
  });

  test("handles empty-ish strings gracefully", async () => {
    const slug = await generateUniqueSlug("   ", async () => false);
    expect(typeof slug).toBe("string");
  });

  test("trims whitespace from the base string", async () => {
    const slug = await generateUniqueSlug("  Hello World  ", async () => false);
    expect(slug).toBe("hello-world");
  });

  test("handles strings with only numbers", async () => {
    const slug = await generateUniqueSlug("12345", async () => false);
    expect(slug).toBe("12345");
  });

  test("handles author names with periods", async () => {
    const slug = await generateUniqueSlug("J.R.R. Tolkien", async () => false);
    expect(slug).toBe("jrr-tolkien");
  });
});
