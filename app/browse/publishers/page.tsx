"use client";

import { ManagedEntityBrowseSection } from "@/components/browse/managed-entity-browse-section";
import { publisherSortOptions } from "@/lib/browse-params";

type PublisherBrowseItem = {
  id: string;
  name: string;
  slug: string;
};

export default function PublishersPage() {
  return (
    <ManagedEntityBrowseSection<PublisherBrowseItem>
      sectionKey="publishers"
      sortOptions={publisherSortOptions}
      getQueryOptions={(trpc, params) => trpc.books.allPublishers.queryOptions(params)}
      mapItemHref={(item) => `/browse/books?publisher=${item.slug}`}
      getUpdateMutationOptions={(trpc) => trpc.books.updatePublisher.mutationOptions()}
      getDeleteMutationOptions={(trpc) => trpc.books.deletePublisher.mutationOptions()}
      getUpdateInput={(publisherId, name) => ({ publisherId, name })}
      getDeleteInput={(publisherId) => ({ publisherId })}
      duplicateErrorCode="PUBLISHER_ALREADY_EXISTS"
    />
  );
}
