import { API } from "@/lib/constants";

type TaggableCount = {
  tag: {
    id: number;
    tag: string;
    tag_category_id: number;
    count: number;
  };
};

export function extractMainGenres(
  taggableCounts: TaggableCount[],
  threshold: number = 0.8,
  maxGenres: number = 3,
  genreCategoryId: number = API.HARDCOVER_GENRE_TAG_CATEGORY_ID,
): { id: number; name: string }[] {
  // 1. Keep only genre tags.
  const genres = taggableCounts.filter((tc) => tc.tag.tag_category_id === genreCategoryId);

  if (genres.length === 0) return [];

  // 2. Merge duplicates
  const mergedMap = new Map<string, { id: number; name: string; count: number }>();

  for (const tc of genres) {
    const key = tc.tag.tag.toLowerCase();
    const existing = mergedMap.get(key);

    if (existing) {
      if (tc.tag.count > existing.count) {
        existing.id = tc.tag.id;
        existing.name = tc.tag.tag;
      }

      existing.count += tc.tag.count;
    } else {
      mergedMap.set(key, { id: tc.tag.id, name: tc.tag.tag, count: tc.tag.count });
    }
  }

  // 3. Sort by count descending.
  const sorted = [...mergedMap.values()].sort((a, b) => b.count - a.count);

  // 4. Compute total weight for normalization.
  const totalWeight = sorted.reduce((sum, g) => sum + g.count, 0);

  if (totalWeight === 0) return [];

  // 5. Greedily accumulate genres until we hit the threshold or the cap.
  const result: { id: number; name: string }[] = [];
  let cumulative = 0;

  for (const g of sorted) {
    if (result.length >= maxGenres) break;

    result.push({ id: g.id, name: g.name });
    cumulative += g.count / totalWeight;

    if (cumulative >= threshold) break;
  }

  return result;
}
