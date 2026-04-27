"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import type { FilterConfig } from "@/lib/browse-params";
import { useTRPC } from "@/lib/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { LucideFilter } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useRef } from "react";

interface BrowseFilterDialogProps {
  filters: FilterConfig[];
  filterValues: Record<string, string>;
  onFilterChange: (paramKey: string, value: string) => void;
  activeCount: number;
}

export function BrowseFilters({ filters, filterValues, onFilterChange, activeCount }: BrowseFilterDialogProps) {
  const t = useTranslations("browse");
  const ref = useRef<HTMLDivElement>(null);

  const triggerButton = (
    <Button variant="outline" className="gap-1.5">
      <LucideFilter className="size-4" />
      {t("filter.label")}
      {activeCount > 0 && (
        <Badge variant="default" className="ml-0.5 h-4 min-w-4 px-1 text-[10px]">
          {activeCount}
        </Badge>
      )}
    </Button>
  );

  const filterContent = (
    <div className="space-y-4">
      {filters.map((filter) => (
        <FilterCombobox
          key={filter.paramKey}
          filter={filter}
          value={filterValues[filter.paramKey] ?? ""}
          onChange={(value) => onFilterChange(filter.paramKey, value)}
        />
      ))}
    </div>
  );

  return (
    <ResponsiveDialog>
      <ResponsiveDialogTrigger asChild>{triggerButton}</ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="sm:max-w-md" ref={ref}>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t("filter.label")}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="overflow-y-auto pb-4 sm:pb-0">{filterContent}</ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

type FilterOption = { value: string; label: string };
type ReadingStatusFilterKey = "WANT_TO_READ" | "READING" | "COMPLETED" | "PAUSED" | "ABANDONED";

function FilterCombobox({
  filter,
  value,
  onChange,
}: {
  filter: FilterConfig;
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useTranslations("browse");
  const tReadingStatus = useTranslations("common.readingStatus");
  const trpc = useTRPC();

  const queryOptions = (() => {
    switch (filter.optionsEndpoint) {
      case "genres":
        return trpc.books.filterGenres.queryOptions();
      case "authors":
        return trpc.books.filterAuthors.queryOptions();
      case "publishers":
        return trpc.books.filterPublishers.queryOptions();
      case "series":
        return trpc.books.filterSeries.queryOptions();
      case "statuses":
        return trpc.books.filterStatuses.queryOptions();
      case "tags":
        return trpc.books.filterTags.queryOptions();
      case "formats":
        return trpc.books.filterFormats.queryOptions();
    }
  })();

  const { data: options } = useQuery(queryOptions as Parameters<typeof useQuery<unknown>>[0]);

  const normalizedOptions = useMemo(
    () => normalizeFilterOptions(options, filter.optionsEndpoint, tReadingStatus),
    [options, filter.optionsEndpoint, tReadingStatus],
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value) ?? null;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">{t(filter.labelKey as Parameters<typeof t>[0])}</label>
      <Combobox
        value={selectedOption}
        onValueChange={(val) => onChange(val?.value ?? "")}
        items={normalizedOptions}
        itemToStringValue={(item) => item.label}
      >
        <ComboboxInput placeholder={t("search.placeholder")} showClear={!!value} />
        {/* Prevent wheel events from bubbling to the parent dialog while scrolling options. */}
        <ComboboxContent onWheel={(e) => e.stopPropagation()} className="pointer-events-auto">
          <ComboboxEmpty>{t("empty.no-results")}</ComboboxEmpty>
          <ComboboxList className="pointer-events-auto">
            {(item) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

function normalizeFilterOptions(
  options: unknown,
  endpoint: FilterConfig["optionsEndpoint"],
  tReadingStatus: ReturnType<typeof useTranslations>,
): FilterOption[] {
  if (!options || !Array.isArray(options)) return [];

  if (endpoint === "formats") {
    return (options as string[]).map((o) => ({ value: o, label: o }));
  }

  if (endpoint === "statuses") {
    return (options as { value: string }[]).map((o) => ({
      value: o.value,
      label: tReadingStatus(o.value as ReadingStatusFilterKey),
    }));
  }

  if (endpoint === "tags") {
    return (options as { name: string }[]).map((o) => ({ value: o.name, label: o.name }));
  }

  return (options as { slug: string; name: string }[]).map((o) => ({
    value: o.slug,
    label: o.name,
  }));
}
