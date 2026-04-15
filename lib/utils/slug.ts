import slug from "slug";

/**
 * Generate a slug from a base string.
 * If the slug already exists, appends an incrementing number (e.g. `my-book`, `my-book-1`, `my-book-2`).
 */
export async function generateUniqueSlug(base: string, exists: (slug: string) => Promise<boolean>): Promise<string> {
  const baseSlug = slug(base, { lower: true });

  if (!(await exists(baseSlug))) {
    return baseSlug;
  }

  let counter = 1;
  while (true) {
    const candidate = `${baseSlug}-${counter}`;
    if (!(await exists(candidate))) {
      return candidate;
    }
    counter++;
  }
}
