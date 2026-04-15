"use client";

import { Button } from "@/components/ui/button";
import { DEFAULT_PAGE_SIZE } from "@/lib/browse-params";
import { useTranslations } from "next-intl";

interface BrowsePaginationProps {
  total: number;
  page: number;
  onPageChange: (page: number) => void;
}

export function BrowsePagination({ total, page, onPageChange }: BrowsePaginationProps) {
  const t = useTranslations("browse");
  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));

  // Clamp page to valid range
  const clampedPage = Math.max(1, Math.min(page, totalPages));

  return (
    <div className="flex min-h-9 items-center justify-between">
      <p className="text-muted-foreground text-sm">
        {total > 0
          ? t("pagination.showing", {
              from: (clampedPage - 1) * DEFAULT_PAGE_SIZE + 1,
              to: Math.min(clampedPage * DEFAULT_PAGE_SIZE, total),
              total,
            })
          : t("pagination.showing", { from: 0, to: 0, total: 0 })}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          disabled={clampedPage <= 1}
          onClick={() => onPageChange(Math.max(1, clampedPage - 1))}
        >
          {t("pagination.previous")}
        </Button>
        <span className="text-muted-foreground px-2 text-sm">
          {clampedPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          disabled={clampedPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, clampedPage + 1))}
        >
          {t("pagination.next")}
        </Button>
      </div>
    </div>
  );
}
