"use client";

import { BrowseList } from "@/components/browse/browse-list";
import { BrowseSectionHeader } from "@/components/browse/browse-section-header";
import { BrowseToolbar } from "@/components/browse/browse-toolbar";
import { EntityCard, type EntityCardActions } from "@/components/browse/entity-card";
import { type SortOption, commonSearchParams } from "@/lib/browse-params";
import { useTRPC } from "@/lib/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";

interface EntityCardMapping {
  id: string;
  name: string;
  href: string;
  actions?: EntityCardActions;
}

interface EntityBrowseSectionProps<TItem = unknown> {
  /** Translation key prefix used for title, description, and search placeholder */
  sectionKey: string;
  sortOptions: SortOption[];
  /** Returns tRPC queryOptions for the entity list endpoint */
  getQueryOptions: (
    trpc: ReturnType<typeof useTRPC>,
    params: { page: number; search: string; sort: string },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => any;
  /** Maps a response item to EntityCard props */
  mapItem: (item: TItem) => EntityCardMapping;
}

export function EntityBrowseSection<TItem = unknown>({
  sectionKey,
  sortOptions,
  getQueryOptions,
  mapItem,
}: EntityBrowseSectionProps<TItem>) {
  const t = useTranslations("browse");
  const tEntities = useTranslations("common.entities");
  const trpc = useTRPC();

  const entityTitleKeyMap: Record<string, "authors" | "series" | "genres" | "publishers"> = {
    authors: "authors",
    series: "series",
    genres: "genres",
    publishers: "publishers",
  };

  const mappedEntityTitleKey = entityTitleKeyMap[sectionKey];

  const [params, setParams] = useQueryStates(commonSearchParams, { shallow: false });

  const { data, isLoading } = useQuery(
    getQueryOptions(trpc, {
      page: params.page,
      search: params.q,
      sort: params.sort,
    }),
  );

  const result = data as { items: TItem[]; total: number } | undefined;

  return (
    <div>
      <BrowseSectionHeader
        title={
          mappedEntityTitleKey ? tEntities(mappedEntityTitleKey) : t(`${sectionKey}.title` as Parameters<typeof t>[0])
        }
        description={t(`${sectionKey}.description` as Parameters<typeof t>[0])}
      />

      <BrowseToolbar
        search={params.q}
        onSearchChange={(q) => setParams({ q, page: 1 })}
        searchPlaceholder={t(`search.placeholder-${sectionKey}` as Parameters<typeof t>[0])}
        sort={params.sort}
        onSortChange={(sort) => setParams({ sort })}
        sortOptions={sortOptions}
        total={result?.total}
        page={params.page}
        onPageChange={(page) => setParams({ page })}
      />

      <BrowseList
        variant="entity"
        isLoading={isLoading}
        isEmpty={!isLoading && result?.items.length === 0}
        emptyMessage={t("empty.no-results")}
        emptyHint={t("empty.try-different")}
      >
        {result?.items.map((item) => {
          const mapped = mapItem(item);
          return <EntityCard key={mapped.id} name={mapped.name} href={mapped.href} actions={mapped.actions} />;
        })}
      </BrowseList>
    </div>
  );
}
