import { READING_STATUS_FILTER_VALUES } from "@/lib/books/reading-status";
import { parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs";

/**
 * Shared URL search param parsers for browse list pages.
 * These define the shape and defaults of URL query params.
 */

/** Common params shared across all browse list views */
export const commonSearchParams = {
  q: parseAsString.withDefault(""),
  sort: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};

/** Filter params for edition-based views */
export const editionFilterParams = {
  genre: parseAsString.withDefault(""),
  author: parseAsString.withDefault(""),
  publisher: parseAsString.withDefault(""),
  series: parseAsString.withDefault(""),
  format: parseAsString.withDefault(""),
};

/** Filter params for My Books (user-specific filters) */
export const myBooksFilterParams = {
  status: parseAsStringLiteral(READING_STATUS_FILTER_VALUES).withDefault(""),
  tag: parseAsString.withDefault(""),
};

/** Filter params for work-based views */
export const workFilterParams = {
  genre: parseAsString.withDefault(""),
  author: parseAsString.withDefault(""),
  series: parseAsString.withDefault(""),
};

/**
 * Combined param sets (common + filters) for single useQueryStates call.
 * Using a single hook prevents double URL updates when changing a filter + resetting page.
 */
export const editionBrowseParams = { ...commonSearchParams, ...editionFilterParams };
export const workBrowseParams = { ...commonSearchParams, ...workFilterParams };
export const myBooksBrowseParams = { ...commonSearchParams, ...editionFilterParams, ...myBooksFilterParams };

/** @see {@link import('@/lib/constants').DEFAULT_PAGE_SIZE}, re-exported for convenience */
export { DEFAULT_PAGE_SIZE } from "@/lib/constants";

/** Sort options per entity type */
export type SortOption = {
  value: string;
  labelKey: string;
};

export const editionSortOptions: SortOption[] = [
  { value: "title-asc", labelKey: "sort.title-asc" },
  { value: "title-desc", labelKey: "sort.title-desc" },
  { value: "year-desc", labelKey: "sort.year-desc" },
  { value: "year-asc", labelKey: "sort.year-asc" },
];

export const workSortOptions: SortOption[] = [
  { value: "title-asc", labelKey: "sort.title-asc" },
  { value: "title-desc", labelKey: "sort.title-desc" },
  { value: "year-desc", labelKey: "sort.year-desc" },
  { value: "year-asc", labelKey: "sort.year-asc" },
];

/** Shared sort options for entities sorted by name (authors, series, genres) */
export const entityNameSortOptions: SortOption[] = [
  { value: "name-asc", labelKey: "sort.name-asc" },
  { value: "name-desc", labelKey: "sort.name-desc" },
];

export const publisherSortOptions: SortOption[] = [
  { value: "name-asc", labelKey: "sort.name-asc" },
  { value: "name-desc", labelKey: "sort.name-desc" },
];

export const tagSortOptions: SortOption[] = [
  { value: "name-asc", labelKey: "sort.name-asc" },
  { value: "name-desc", labelKey: "sort.name-desc" },
  { value: "editions-desc", labelKey: "sort.editions-desc" },
];

/**
 * Filter configuration for the browse toolbar.
 * paramKey: URL param name
 * labelKey: i18n key for the filter label
 * optionsEndpoint: tRPC endpoint key for loading filter options
 */
export type FilterConfig = {
  paramKey: string;
  labelKey: string;
  optionsEndpoint: "genres" | "authors" | "publishers" | "series" | "statuses" | "tags" | "formats";
};

export const editionFilters: FilterConfig[] = [
  { paramKey: "genre", labelKey: "filter.genre", optionsEndpoint: "genres" },
  { paramKey: "author", labelKey: "filter.author", optionsEndpoint: "authors" },
  { paramKey: "publisher", labelKey: "filter.publisher", optionsEndpoint: "publishers" },
  { paramKey: "series", labelKey: "filter.series", optionsEndpoint: "series" },
  { paramKey: "format", labelKey: "filter.format", optionsEndpoint: "formats" },
];

export const myBooksFilters: FilterConfig[] = [
  { paramKey: "status", labelKey: "filter.status", optionsEndpoint: "statuses" },
  { paramKey: "tag", labelKey: "filter.tag", optionsEndpoint: "tags" },
  ...editionFilters,
];

export const workFilters: FilterConfig[] = [
  { paramKey: "genre", labelKey: "filter.genre", optionsEndpoint: "genres" },
  { paramKey: "author", labelKey: "filter.author", optionsEndpoint: "authors" },
  { paramKey: "series", labelKey: "filter.series", optionsEndpoint: "series" },
];
