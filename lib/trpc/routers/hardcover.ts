import { BookType } from "@/generated/prisma/enums";
import { externalAPICache } from "@/lib/api/api-cache";
import { extractMainGenres } from "@/lib/books/extract-main-genres";
import { extractPublishedYear } from "@/lib/books/extract-published-year";
import { mapEditionFormat } from "@/lib/books/format-mapper";
import { API } from "@/lib/constants";
import { env } from "@/lib/env";
import { fetchWithTimeout } from "@/lib/utils/fetch";
import { normalizeAndValidateIsbn } from "@/lib/utils/isbn";
import { TRPCError } from "@trpc/server";
import { createHash } from "crypto";
import z from "zod/v4";

import { protectedProcedure, router } from "../init";
import { InternalHardcoverEditionDetailsResponse } from "./internal-types/hardcover-edition-details";
import { InternalHardcoverSearchResponse } from "./internal-types/hardcover-search";
import { InternalHardcoverWorkEditionsResponse } from "./internal-types/hardcover-work-editions";

const HARDCOVER_FETCH_TIMEOUT_MS = 12000;

type GraphQLErrorPayload = {
  errors: Array<{ message?: string }>;
};

type HardcoverAPIErrorMessage = "HARDCOVER_API_REQUEST_FAILED" | "HARDCOVER_API_INVALID_RESPONSE";

function hasGraphQLErrors(value: unknown): value is GraphQLErrorPayload {
  return typeof value === "object" && value !== null && Array.isArray((value as GraphQLErrorPayload).errors);
}

function throwHardcoverAPIError(
  errorMessage: HardcoverAPIErrorMessage,
  logMessage: string,
  details: Record<string, unknown>,
): never {
  console.error(logMessage, details);

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: errorMessage,
  });
}

async function parseHardcoverPayload(response: Response, variables: Record<string, unknown>): Promise<unknown> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    throwHardcoverAPIError("HARDCOVER_API_INVALID_RESPONSE", "Hardcover API returned invalid JSON:", {
      error,
      variables,
    });
  }

  if (hasGraphQLErrors(payload) && payload.errors.length > 0) {
    throwHardcoverAPIError("HARDCOVER_API_REQUEST_FAILED", "Hardcover GraphQL errors:", {
      errors: payload.errors.map((error) => error.message ?? "Unknown GraphQL error"),
      variables,
    });
  }

  return payload;
}

function getCacheKey(prefix: string, params: Record<string, unknown>): string {
  const key = `${prefix}:${JSON.stringify(params)}`;
  return createHash("sha1").update(key).digest("hex");
}

export type HardcoverSearchResponse = {
  found: number;
  page: number;
  perPage: number;
  results: {
    id: number;
    title: string;
    subtitle?: string;
    authorNames: string[];
    image?: string;
    releaseYear?: number;
  }[];
};
export type HardcoverEditionsResponse = {
  results: {
    id: number;
    title: string;
    subtitle?: string;
    bookType?: BookType;
    format?: string;
    audioSeconds?: number;
    pages?: number;
    releaseYear?: number;
    isbn10?: string;
    isbn13?: string;
    publisher?: { id: number; name: string };
    authors: { id: number; name: string }[];
    image?: { url: string };
    workId: number;
  }[];
};

export type HardcoverEditionDetailsResponse = {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  type?: BookType;
  format?: string;
  audioSeconds?: number;
  pages?: number;
  releaseYear?: number;
  isbn10?: string;
  isbn13?: string;
  publisher?: { id: number; name: string };
  authors: { id: number; name: string }[];
  genres: { id: number; name: string }[];
  series: { id: number; name: string; description?: string; position: number }[];
  image?: { url: string };
};

const SEARCH_QUERY = `
query HardcoverSearch($query: String!, $query_type: String!, $per_page: Int!, $page: Int!) {
  search(
    query: $query
    query_type: $query_type
    per_page: $per_page
    page: $page
    fields: "title,isbns,series_names,author_names,alternative_titles"
    sort: "users_count:desc,_text_match:desc"
    weights: "5,5,3,1,1"
  ) {
    results
  }
}`;

const WORK_EDITIONS_QUERY = `
query GetWorkEditions($bookId: Int!) {
  editions(where: { book_id: { _eq: $bookId } }, order_by: {users_count: desc}) {
    id
    title
    subtitle
    edition_format
    audio_seconds
    pages
    release_date
    release_year
    isbn_10
    isbn_13
    publisher {
      id
      name
    }
    contributions {
      author {
        id
        name
      }
    }
    image {
      url
    }
    book {
      id
    }
  }
}`;

const SEARCH_BY_ISBN_QUERY = `
query SearchByIsbn($isbn: String!) {
  editions(
    where: {
      _or: [
        { isbn_10: { _eq: $isbn } }
        { isbn_13: { _eq: $isbn } }
      ]
    }
    order_by: { users_count: desc }
  ) {
    id
    title
    subtitle
    edition_format
    audio_seconds
    pages
    release_date
    release_year
    isbn_10
    isbn_13
    publisher {
      id
      name
    }
    contributions {
      author {
        id
        name
      }
    }
    image {
      url
    }
    book {
      id
    }
  }
}`;

const EDITION_DETAILS_QUERY = `
query GetEditionDetails($editionId: Int!) {
  editions(where: { id: { _eq: $editionId } }) {
    id
    title
    subtitle
    edition_format
    audio_seconds
    pages
    release_date
    release_year
    isbn_10
    isbn_13
    publisher {
      id
      name
    }
    contributions {
      author {
        id
        name
      }
    }
    image {
      url
    }
    book {
      id
      title
      subtitle
      description
      contributions {
        author {
          id
          name
        }
      }
      taggable_counts {
        tag {
          id
          tag_category_id
          tag
          count
        }
      }
      book_series {
        series_id
        position
        series {
          name
          description
        }
      }
    }
  }
}`;

async function hardcoverFetch<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  if (!env.HARDCOVER_API_TOKEN) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "HARDCOVER_API_TOKEN_NOT_CONFIGURED",
    });
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(
      API.HARDCOVER_API_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.HARDCOVER_API_TOKEN}`,
        },
        body: JSON.stringify({ query, variables }),
      },
      HARDCOVER_FETCH_TIMEOUT_MS,
    );
  } catch (error) {
    throwHardcoverAPIError("HARDCOVER_API_REQUEST_FAILED", "Hardcover API request failed:", {
      error,
      variables,
    });
  }

  if (!response.ok) {
    throwHardcoverAPIError("HARDCOVER_API_REQUEST_FAILED", "Hardcover API error:", {
      status: response.status,
      statusText: response.statusText,
      body: await response.text(),
      variables,
    });
  }

  const payload = await parseHardcoverPayload(response, variables);

  return payload as T;
}

type InternalHardcoverEditionRecord = InternalHardcoverWorkEditionsResponse["data"]["editions"][number];

function mapHardcoverEdition(edition: InternalHardcoverEditionRecord): HardcoverEditionsResponse["results"][number] {
  const releaseYear = edition.release_year || extractPublishedYear(edition.release_date) || undefined;
  return {
    id: edition.id,
    title: edition.title,
    subtitle: edition.subtitle,
    bookType: mapEditionFormat(edition.edition_format),
    format: edition.edition_format,
    audioSeconds: edition.audio_seconds,
    pages: edition.pages,
    releaseYear,
    isbn10: edition.isbn_10,
    isbn13: edition.isbn_13,
    publisher: edition.publisher ? { id: edition.publisher.id, name: edition.publisher.name } : undefined,
    authors: edition.contributions.map((c) => ({
      id: c.author.id,
      name: c.author.name,
    })),
    image: edition.image,
    workId: edition.book.id,
  };
}

export const hardcoverRouter = router({
  search: protectedProcedure
    .input(
      z.object({
        q: z.string().min(1),
        perPage: z.number().int().positive().default(10),
        page: z.number().int().positive().default(1),
      }),
    )
    .query(async ({ input }) => {
      const query = input.q.trim().toLowerCase();
      const { perPage, page } = input;
      const cacheKey = getCacheKey("hardcover:search", { query, perPage, page });

      const cached = externalAPICache?.get(cacheKey) as HardcoverSearchResponse | undefined;
      if (cached) return cached;

      const raw = await hardcoverFetch<InternalHardcoverSearchResponse>(SEARCH_QUERY, {
        query,
        query_type: "book",
        per_page: perPage,
        page,
      });

      const mapped: HardcoverSearchResponse = {
        found: raw.data.search.results.found,
        page: raw.data.search.results.page,
        perPage: raw.data.search.results.request_params.per_page,
        results: raw.data.search.results.hits.map((hit) => {
          const doc = hit.document;
          const releaseYear = doc.release_year || extractPublishedYear(doc.release_date) || undefined;
          return {
            id: parseInt(doc.id, 10),
            title: doc.title,
            subtitle: doc.subtitle,
            authorNames: doc.author_names,
            image: doc.image.url,
            releaseYear,
          };
        }),
      };

      externalAPICache?.set(cacheKey, mapped);
      return mapped;
    }),

  workEditions: protectedProcedure.input(z.object({ workId: z.number().int() })).query(async ({ input }) => {
    const cacheKey = getCacheKey("hardcover:editions", { workId: input.workId });
    const cached = externalAPICache?.get(cacheKey) as HardcoverEditionsResponse | undefined;
    if (cached) return cached;

    const raw = await hardcoverFetch<InternalHardcoverWorkEditionsResponse>(WORK_EDITIONS_QUERY, {
      bookId: input.workId,
    });

    const mapped: HardcoverEditionsResponse = {
      results: raw.data.editions.map(mapHardcoverEdition),
    };

    externalAPICache?.set(cacheKey, mapped);
    return mapped;
  }),

  searchByIsbn: protectedProcedure
    .input(
      z.object({
        isbn: z.string().min(1).max(64),
      }),
    )
    .query(async ({ input }) => {
      const normalized = normalizeAndValidateIsbn(input.isbn);

      if (!normalized) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_ISBN" });
      }

      const cacheKey = getCacheKey("hardcover:searchByIsbn", { isbn: normalized.value });
      const cached = externalAPICache?.get(cacheKey) as HardcoverEditionsResponse | undefined;
      if (cached) return cached;

      const raw = await hardcoverFetch<InternalHardcoverWorkEditionsResponse>(SEARCH_BY_ISBN_QUERY, {
        isbn: normalized.value,
      });

      const mapped: HardcoverEditionsResponse = {
        results: raw.data.editions.map(mapHardcoverEdition),
      };

      externalAPICache?.set(cacheKey, mapped);
      return mapped;
    }),

  editionDetails: protectedProcedure.input(z.object({ id: z.number().int() })).query(async ({ input }) => {
    const cacheKey = getCacheKey("hardcover:editionDetails", { id: input.id });
    const cached = externalAPICache?.get(cacheKey) as HardcoverEditionDetailsResponse | undefined;
    if (cached) return cached;

    const raw = await hardcoverFetch<InternalHardcoverEditionDetailsResponse>(EDITION_DETAILS_QUERY, {
      editionId: input.id,
    });

    const edition = raw.data.editions[0];

    if (!edition) {
      throw new TRPCError({ code: "NOT_FOUND", message: "EDITION_NOT_FOUND" });
    }

    const releaseYear = edition.release_year || extractPublishedYear(edition.release_date) || undefined;

    // Merge authors from work and edition, with work authors coming first
    const workAuthors = edition.book.contributions.map((c) => ({
      id: c.author.id,
      name: c.author.name,
    }));
    const editionAuthors = edition.contributions.map((c) => ({
      id: c.author.id,
      name: c.author.name,
    }));
    const mergedAuthors = [
      ...workAuthors,
      ...editionAuthors.filter((ea) => !workAuthors.some((wa) => wa.id === ea.id && wa.name === ea.name)),
    ];

    const mapped: HardcoverEditionDetailsResponse = {
      id: edition.id,
      title: edition.title,
      subtitle: edition.subtitle,
      description: edition.book.description,
      type: mapEditionFormat(edition.edition_format),
      format: edition.edition_format,
      audioSeconds: edition.audio_seconds,
      pages: edition.pages,
      releaseYear,
      isbn10: edition.isbn_10,
      isbn13: edition.isbn_13,
      publisher: edition.publisher ? { id: edition.publisher.id, name: edition.publisher.name } : undefined,
      authors: mergedAuthors,
      series: edition.book.book_series.map((s) => ({
        id: s.series_id,
        name: s.series.name,
        description: s.series.description,
        // TODO: Handle null/0 position
        position: s.position,
      })),
      genres: extractMainGenres(edition.book.taggable_counts),
      image: edition.image,
    };

    externalAPICache?.set(cacheKey, mapped);

    return mapped;
  }),
});
