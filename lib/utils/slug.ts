import slug from "slug";

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
