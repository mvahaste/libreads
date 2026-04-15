"use client";

import { BookCard } from "@/components/browse/books/book-card";
import { BrowseList } from "@/components/browse/browse-list";
import { BrowseSectionHeader } from "@/components/browse/browse-section-header";
import { BrowseToolbar } from "@/components/browse/browse-toolbar";
import { useDisplayPreferences } from "@/hooks/use-display-preferences";
import { editionSortOptions, myBooksBrowseParams, myBooksFilters } from "@/lib/browse-params";
import { useTRPC } from "@/lib/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";

export default function MyBooksPage() {
  const t = useTranslations("browse");
  const trpc = useTRPC();
  const [displayMode, setDisplayMode] = useDisplayPreferences("edition");

  const [params, setParams] = useQueryStates(myBooksBrowseParams, { shallow: false });

  const filterValues = {
    status: params.status,
    tag: params.tag,
    genre: params.genre,
    author: params.author,
    publisher: params.publisher,
    series: params.series,
    format: params.format,
  };

  const { data, isLoading } = useQuery(
    trpc.books.myBooks.queryOptions({
      page: params.page,
      search: params.q,
      sort: params.sort,
      ...filterValues,
    }),
  );

  const handleFilterChange = (key: string, value: string) => {
    setParams({ [key]: value, page: 1 });
  };

  return (
    <div>
      <BrowseSectionHeader title={t("my-books.title")} description={t("my-books.description")} />

      <BrowseToolbar
        search={params.q}
        onSearchChange={(q) => setParams({ q, page: 1 })}
        searchPlaceholder={t("search.placeholder-my-books")}
        sort={params.sort}
        onSortChange={(sort) => setParams({ sort })}
        sortOptions={editionSortOptions}
        filters={myBooksFilters}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
        availableDisplayModes={["default", "compact", "list", "cover"]}
        total={data?.total}
        page={params.page}
        onPageChange={(page) => setParams({ page })}
      />

      <BrowseList
        displayMode={displayMode}
        variant="book"
        isLoading={isLoading}
        isEmpty={!isLoading && data?.items.length === 0}
        emptyMessage={t("empty.no-books")}
        emptyHint={t("empty.try-different")}
      >
        {data?.items.map((edition) => (
          <BookCard key={edition.id} book={edition} displayMode={displayMode} />
        ))}
      </BrowseList>
    </div>
  );
}
