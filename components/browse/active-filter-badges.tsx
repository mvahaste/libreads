"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LucideX } from "lucide-react";
import { useTranslations } from "next-intl";

interface ActiveFilterBadgesProps {
  filterValues: Record<string, string>;
  filterLabels: Record<string, Record<string, string>>;
  onFilterChange: (paramKey: string, value: string) => void;
  onClearAll: () => void;
}

export function ActiveFilterBadges({
  filterValues,
  filterLabels,
  onFilterChange,
  onClearAll,
}: ActiveFilterBadgesProps) {
  const t = useTranslations("browse");

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {Object.entries(filterValues).map(([key, value]) =>
        value ? (
          <Badge key={key} variant="secondary" suppressHydrationWarning>
            {filterLabels[key]?.[value] ?? value}
            <button
              onClick={() => onFilterChange(key, "")}
              className="hover:bg-muted -mr-2 cursor-pointer rounded-full p-1"
            >
              <LucideX className="size-3" />
            </button>
          </Badge>
        ) : null,
      )}
      <Button variant="ghost" size="xs" onClick={onClearAll}>
        {t("filter.clear-all")}
      </Button>
    </div>
  );
}
