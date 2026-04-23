"use client";

import { ManagedEntityBrowseSection } from "@/components/browse/managed-entity-browse-section";
import { entityNameSortOptions } from "@/lib/browse-params";

type SeriesBrowseItem = {
  id: string;
  name: string;
  slug: string;
};

export default function SeriesPage() {
  return (
    <ManagedEntityBrowseSection<SeriesBrowseItem>
      sectionKey="series"
      sortOptions={entityNameSortOptions}
      getQueryOptions={(trpc, params) => trpc.books.allSeries.queryOptions(params)}
      mapItemHref={(item) => `/browse/series/${item.slug}`}
      getUpdateMutationOptions={(trpc) => trpc.books.updateSeries.mutationOptions()}
      getDeleteMutationOptions={(trpc) => trpc.books.deleteSeries.mutationOptions()}
      getUpdateInput={(seriesId, name) => ({ seriesId, name })}
      getDeleteInput={(seriesId) => ({ seriesId })}
      duplicateErrorCode="SERIES_ALREADY_EXISTS"
    />
  );
}
