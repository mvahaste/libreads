export type SeriesGroupedBook = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  coverId: string | null;
  publishYear: number | null;
  authors: string[];
};

export type SeriesGroupingEntry = {
  position: number | null;
  book: SeriesGroupedBook;
};

export type SeriesGroupingGroup = {
  groupKey: string;
  position: number | null;
  books: SeriesGroupedBook[];
};

export function groupSeriesBooks(entries: SeriesGroupingEntry[]): SeriesGroupingGroup[] {
  const groups: SeriesGroupingGroup[] = [];
  const nonNullGroupIndex = new Map<number, number>();

  for (const entry of entries) {
    if (entry.position == null) {
      groups.push({
        groupKey: `null:${entry.book.id}`,
        position: null,
        books: [entry.book],
      });
      continue;
    }

    const existingGroupIndex = nonNullGroupIndex.get(entry.position);

    if (existingGroupIndex == null) {
      nonNullGroupIndex.set(entry.position, groups.length);
      groups.push({
        groupKey: `position:${entry.position}`,
        position: entry.position,
        books: [entry.book],
      });
      continue;
    }

    groups[existingGroupIndex].books.push(entry.book);
  }

  return groups;
}
