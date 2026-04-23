"use client";

import { ManagedEntityBrowseSection } from "@/components/browse/managed-entity-browse-section";
import { entityNameSortOptions } from "@/lib/browse-params";

type AuthorBrowseItem = {
  id: string;
  name: string;
  slug: string;
};

export default function AuthorsPage() {
  return (
    <ManagedEntityBrowseSection<AuthorBrowseItem>
      sectionKey="authors"
      sortOptions={entityNameSortOptions}
      getQueryOptions={(trpc, params) => trpc.books.allAuthors.queryOptions(params)}
      mapItemHref={(item) => `/browse/books?author=${item.slug}`}
      getUpdateMutationOptions={(trpc) => trpc.books.updateAuthor.mutationOptions()}
      getDeleteMutationOptions={(trpc) => trpc.books.deleteAuthor.mutationOptions()}
      getUpdateInput={(authorId, name) => ({ authorId, name })}
      getDeleteInput={(authorId) => ({ authorId })}
      duplicateErrorCode="AUTHOR_ALREADY_EXISTS"
    />
  );
}
