"use client";

import { ManagedEntityBrowseSection } from "@/components/browse/managed-entity-browse-section";
import { entityNameSortOptions } from "@/lib/browse-params";

type GenreBrowseItem = {
  id: string;
  name: string;
  slug: string;
};

export default function GenresPage() {
  return (
    <ManagedEntityBrowseSection<GenreBrowseItem>
      sectionKey="genres"
      sortOptions={entityNameSortOptions}
      getQueryOptions={(trpc, params) => trpc.books.allGenres.queryOptions(params)}
      mapItemHref={(item) => `/browse/books?genre=${item.slug}`}
      getUpdateMutationOptions={(trpc) => trpc.books.updateGenre.mutationOptions()}
      getDeleteMutationOptions={(trpc) => trpc.books.deleteGenre.mutationOptions()}
      getUpdateInput={(genreId, name) => ({ genreId, name })}
      getDeleteInput={(genreId) => ({ genreId })}
      duplicateErrorCode="GENRE_ALREADY_EXISTS"
    />
  );
}
