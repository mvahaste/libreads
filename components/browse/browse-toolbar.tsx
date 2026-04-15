"use client";

import { ActiveFilterBadges } from "@/components/browse/active-filter-badges";
import { BrowseFilters } from "@/components/browse/browse-filter-dialog";
import { BrowsePagination } from "@/components/browse/browse-pagination";
import { BrowseSearchInput } from "@/components/browse/browse-search-input";
import { DisplayModeToggle } from "@/components/browse/display-mode-toggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DisplayMode } from "@/hooks/use-display-preferences";
import type { FilterConfig, SortOption } from "@/lib/browse-params";
import { useTRPC } from "@/lib/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";

const PARAM_KEY_TO_TYPE: Record<string, FilterConfig["optionsEndpoint"]> = {
  genre: "genres",
  author: "authors",
  publisher: "publishers",
  series: "series",
  status: "statuses",
  tag: "tags",
  format: "formats",
};

interface BrowseToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  sort: string;
  onSortChange: (value: string) => void;
  sortOptions: SortOption[];
  filters?: FilterConfig[];
  filterValues?: Record<string, string>;
  onFilterChange?: (paramKey: string, value: string) => void;
  displayMode?: DisplayMode;
  onDisplayModeChange?: (mode: DisplayMode) => void;
  availableDisplayModes?: DisplayMode[];
  total?: number;
  page?: number;
  onPageChange?: (page: number) => void;
}

export function BrowseToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  sort,
  onSortChange,
  sortOptions,
  filters,
  filterValues,
  onFilterChange,
  displayMode,
  onDisplayModeChange,
  availableDisplayModes,
  total,
  page,
  onPageChange,
}: BrowseToolbarProps) {
  const t = useTranslations("browse");
  const trpc = useTRPC();

  const activeFilterCount = filterValues ? Object.values(filterValues).filter((v) => v && v.length > 0).length : 0;

  const normalizedFilterValues = useMemo(() => filterValues ?? {}, [filterValues]);

  const filtersToResolve = useMemo(() => {
    const filters: { type: FilterConfig["optionsEndpoint"]; value: string }[] = [];

    for (const [key, value] of Object.entries(normalizedFilterValues)) {
      if (!value) {
        continue;
      }

      const type = PARAM_KEY_TO_TYPE[key];
      if (!type) {
        continue;
      }

      filters.push({ type, value });
    }

    return filters;
  }, [normalizedFilterValues]);

  const { data: resolvedLabels } = useQuery({
    ...trpc.books.resolveFilterLabels.queryOptions({ filters: filtersToResolve }),
    enabled: filtersToResolve.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const filterLabels = useMemo(() => {
    const labels: Record<string, Record<string, string>> = {};

    if (!resolvedLabels) {
      return labels;
    }

    for (const [key, value] of Object.entries(normalizedFilterValues)) {
      if (!value) {
        continue;
      }

      const type = PARAM_KEY_TO_TYPE[key];
      if (!type) {
        continue;
      }

      const resolvedKey = `${type}:${value}`;
      if (type === "statuses") {
        labels[key] = { [value]: t(`reading-status.${value}` as Parameters<typeof t>[0]) };
        continue;
      }

      const label = resolvedLabels[resolvedKey];
      if (label) {
        labels[key] = { [value]: label };
      }
    }

    return labels;
  }, [normalizedFilterValues, resolvedLabels, t]);

  const handleClearAllFilters = useCallback(() => {
    if (filterValues && onFilterChange) {
      Object.keys(filterValues).forEach((key) => {
        if (filterValues[key]) onFilterChange(key, "");
      });
    }
  }, [filterValues, onFilterChange]);

  return (
    <div className="mb-4 space-y-3">
      {/* Main toolbar row */}
      <div className="flex flex-wrap items-center gap-2">
        <BrowseSearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder ?? t("search.placeholder")}
        />

        {/* Sort */}
        {sortOptions.length > 0 && (
          <Select value={sort || sortOptions[0]?.value} onValueChange={onSortChange}>
            <SelectTrigger className="w-auto min-w-36">
              <SelectValue placeholder={t("sort.label")} />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {t(opt.labelKey as Parameters<typeof t>[0])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Filters button (opens dialog) */}
        {filters && filters.length > 0 && onFilterChange && (
          <BrowseFilters
            filters={filters}
            filterValues={filterValues ?? {}}
            onFilterChange={onFilterChange}
            activeCount={activeFilterCount}
          />
        )}

        {/* Display mode toggle */}
        {displayMode && onDisplayModeChange && (
          <DisplayModeToggle
            value={displayMode}
            onChange={onDisplayModeChange}
            availableModes={availableDisplayModes}
          />
        )}
      </div>

      {/* Active filters row */}
      {activeFilterCount > 0 && filterValues && onFilterChange && (
        <ActiveFilterBadges
          filterValues={filterValues}
          filterLabels={filterLabels}
          onFilterChange={onFilterChange}
          onClearAll={handleClearAllFilters}
        />
      )}

      {/* Pagination + count row */}
      {onPageChange && <BrowsePagination total={total ?? 0} page={page ?? 1} onPageChange={onPageChange} />}
    </div>
  );
}
