"use client";

import { useTRPC } from "@/lib/trpc/client";
import { QueryKey, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export function useBooksQueryInvalidation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const invalidateByKeys = useCallback(
    async (keys: QueryKey[]) => {
      await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
    [queryClient],
  );

  const invalidateLibraryState = useCallback(async () => {
    await invalidateByKeys([
      trpc.books.bookDetails.queryKey(),
      trpc.books.myBooks.queryKey(),
      trpc.books.allBooks.queryKey(),
      trpc.books.getLibraryEntryStats.queryKey(),
    ]);
  }, [
    invalidateByKeys,
    trpc.books.bookDetails,
    trpc.books.getLibraryEntryStats,
    trpc.books.myBooks,
    trpc.books.allBooks,
  ]);

  const invalidateLibraryOverview = useCallback(async () => {
    await invalidateByKeys([
      trpc.books.bookDetails.queryKey(),
      trpc.books.myBooks.queryKey(),
      trpc.books.getLibraryEntryStats.queryKey(),
    ]);
  }, [invalidateByKeys, trpc.books.bookDetails, trpc.books.getLibraryEntryStats, trpc.books.myBooks]);

  const invalidateCatalog = useCallback(async () => {
    await invalidateByKeys([
      trpc.books.allBooks.queryKey(),
      trpc.books.allGenres.queryKey(),
      trpc.books.allSeries.queryKey(),
      trpc.books.allAuthors.queryKey(),
      trpc.books.allPublishers.queryKey(),
    ]);
  }, [
    invalidateByKeys,
    trpc.books.allAuthors,
    trpc.books.allBooks,
    trpc.books.allGenres,
    trpc.books.allPublishers,
    trpc.books.allSeries,
  ]);

  const invalidateFormAndBrowse = useCallback(async () => {
    await invalidateByKeys([
      trpc.books.bookDetails.queryKey(),
      trpc.books.myBooks.queryKey(),
      trpc.books.allBooks.queryKey(),
      trpc.books.getLibraryEntryStats.queryKey(),
      trpc.books.filterAuthors.queryKey(),
      trpc.books.allAuthors.queryKey(),
      trpc.books.filterGenres.queryKey(),
      trpc.books.allGenres.queryKey(),
      trpc.books.filterPublishers.queryKey(),
      trpc.books.allPublishers.queryKey(),
      trpc.books.filterSeries.queryKey(),
      trpc.books.allSeries.queryKey(),
      trpc.books.bookFormOptions.queryKey(),
    ]);
  }, [
    invalidateByKeys,
    trpc.books.allBooks,
    trpc.books.bookDetails,
    trpc.books.bookFormOptions,
    trpc.books.filterAuthors,
    trpc.books.allAuthors,
    trpc.books.filterGenres,
    trpc.books.allGenres,
    trpc.books.filterPublishers,
    trpc.books.allPublishers,
    trpc.books.filterSeries,
    trpc.books.allSeries,
    trpc.books.getLibraryEntryStats,
    trpc.books.myBooks,
  ]);

  const invalidateTagsState = useCallback(async () => {
    await invalidateByKeys([
      trpc.books.bookDetails.queryKey(),
      trpc.books.myBooks.queryKey(),
      trpc.books.myTags.queryKey(),
      trpc.books.filterTags.queryKey(),
      trpc.books.allTags.queryKey(),
    ]);
  }, [
    invalidateByKeys,
    trpc.books.allTags,
    trpc.books.bookDetails,
    trpc.books.filterTags,
    trpc.books.myBooks,
    trpc.books.myTags,
  ]);

  return {
    invalidateLibraryState,
    invalidateLibraryOverview,
    invalidateCatalog,
    invalidateFormAndBrowse,
    invalidateTagsState,
  };
}
