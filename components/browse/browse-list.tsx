"use client";

import type { DisplayMode } from "@/hooks/use-display-preferences";
import { cn } from "@/lib/utils/cn";

import { Skeleton } from "../ui/skeleton";

export type BrowseListVariant = "book" | "entity";

interface BrowseListProps {
  displayMode?: DisplayMode;
  variant?: BrowseListVariant;
  isLoading?: boolean;
  children: React.ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
  emptyHint?: string;
}

export function BrowseList({
  displayMode = "default",
  variant = "book",
  isLoading,
  children,
  emptyMessage,
  isEmpty,
  emptyHint,
}: BrowseListProps) {
  if (isLoading) {
    return <BrowseListSkeleton displayMode={displayMode} variant={variant} />;
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground text-sm">{emptyMessage ?? "No results found."}</p>
        {emptyHint && <p className="text-muted-foreground mt-1 text-xs">{emptyHint}</p>}
      </div>
    );
  }

  return <div className={getGridClassName(displayMode, variant)}>{children}</div>;
}

export function getGridClassName(displayMode: DisplayMode, variant: BrowseListVariant = "book") {
  if (variant === "entity") {
    return "grid gap-2 md:grid-cols-2 lg:grid-cols-3";
  }

  switch (displayMode) {
    case "list":
      return "flex flex-col gap-2";
    case "compact":
      return "grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";
    case "cover":
      return "grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6";
    case "default":
    default:
      return variant === "book"
        ? "grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        : "grid gap-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3";
  }
}

function BrowseListSkeleton({ displayMode, variant }: { displayMode: DisplayMode; variant: BrowseListVariant }) {
  const isEntity = variant === "entity";

  const skeletonCount = isEntity
    ? 12
    : displayMode === "compact"
      ? 15
      : displayMode === "cover"
        ? 18
        : displayMode === "list"
          ? 8
          : 8;

  const skeletonClassName = isEntity
    ? "h-12"
    : displayMode === "list"
      ? "h-23"
      : displayMode === "compact" || displayMode === "cover"
        ? "aspect-[0.65/1]"
        : "h-55 sm:h-85";

  return (
    <div
      className={cn(getGridClassName(displayMode, variant), "mask-[linear-gradient(to_bottom,black_0%,transparent)]")}
    >
      {Array.from({ length: skeletonCount }, (_, i) => (
        <Skeleton key={i} className={cn("fade-in w-full rounded-lg", skeletonClassName)} />
      ))}
    </div>
  );
}
