"use client";

import { Badge } from "@/components/ui/badge";
import CoverImage from "@/components/ui/cover-image";
import type { DisplayMode } from "@/hooks/use-display-preferences";
import { cn } from "@/lib/utils/cn";
import { secondsToHoursMinutesSeconds } from "@/lib/utils/duration";
import Link from "next/link";
import { useMemo } from "react";

export interface BookCardData {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  coverId?: string | null;
  publishYear?: number | null;
  pageCount?: number | null;
  audioSeconds?: number | null;
  format?: string | null;
  publisher?: { id: string; name: string } | null;
  authors: { id: string; name: string }[];
  series?: { id: string; name: string; position: number | null } | null;
}

interface BookCardProps {
  book: BookCardData;
  displayMode?: DisplayMode;
}

function useDerivedBookFields(book: BookCardData) {
  return useMemo(() => {
    const authorNames =
      book.authors && book.authors.length ? book.authors.map((a) => a.name).join(", ") : "Unknown author";

    const seriesLabel = book.series
      ? `${book.series.name}${book.series.position != null ? ` #${book.series.position}` : ""}`
      : null;

    const metaParts = [
      book.publishYear,
      book.format,
      book.pageCount ? `${book.pageCount}p` : null,
      book.audioSeconds != null ? secondsToHoursMinutesSeconds(book.audioSeconds) : null,
    ].filter(Boolean);

    const meta = metaParts.length ? metaParts.join(" · ") : null;

    return { authorNames, seriesLabel, meta };
  }, [book]);
}

function SeriesBadge({ label, className }: { label: string; className?: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn("text-shadow-2xs supports-backdrop-filter:backdrop-blur-xl", className)}
      aria-hidden={false}
    >
      {label}
    </Badge>
  );
}

function BookCover({
  title,
  subtitle,
  coverId,
  sizeProps,
  className,
}: {
  title: string;
  subtitle?: string | null;
  coverId?: string | null;
  sizeProps: { width: number; height: number };
  className?: string;
}) {
  return (
    <CoverImage
      width={sizeProps.width}
      height={sizeProps.height}
      title={title}
      subtitle={subtitle ?? undefined}
      localCoverId={coverId ?? undefined}
      className={cn("transition-opacity group-hover:opacity-75", className)}
      aria-hidden={false}
    />
  );
}

function CompactCard({
  book,
  href,
  derived,
}: {
  book: BookCardData;
  href: string;
  derived: ReturnType<typeof useDerivedBookFields>;
}) {
  const { title, subtitle, coverId } = book;
  return (
    <Link
      href={href}
      className={cn(
        "border-border animate-in fade-in group relative cursor-pointer overflow-hidden rounded-lg border",
        "focus-visible:ring-ring focus:outline-none focus-visible:ring-2",
      )}
      aria-label={`${title} - ${derived.authorNames}`}
    >
      <BookCover
        title={title}
        subtitle={subtitle}
        coverId={coverId}
        sizeProps={{ width: 216, height: 324 }}
        className="h-auto w-full"
      />

      {derived.seriesLabel && (
        <div className="absolute top-2 right-2 hidden sm:block">
          <SeriesBadge label={derived.seriesLabel} className="supports-backdrop-filter:bg-card/50 text-xs" />
        </div>
      )}

      <div className="from-background/95 via-background/80 absolute right-0 bottom-0 left-0 h-fit bg-linear-to-t to-transparent p-2 pt-16">
        <p className="text-foreground line-clamp-2 text-sm font-medium text-ellipsis whitespace-pre-wrap text-shadow-2xs">
          {title}
        </p>
        <p className="text-muted-foreground line-clamp-1 text-xs text-ellipsis">{derived.authorNames}</p>
      </div>
    </Link>
  );
}

function CoverOnlyCard({
  book,
  href,
  derived,
}: {
  book: BookCardData;
  href: string;
  derived: ReturnType<typeof useDerivedBookFields>;
}) {
  const { title, subtitle, coverId } = book;
  return (
    <Link
      href={href}
      className="border-border animate-in fade-in group cursor-pointer overflow-hidden rounded-lg border"
      aria-label={`${title} - ${derived.authorNames}`}
    >
      <BookCover
        title={title}
        subtitle={subtitle}
        coverId={coverId}
        sizeProps={{ width: 216, height: 324 }}
        className="h-auto w-full"
      />
    </Link>
  );
}

function ListCard({
  book,
  href,
  derived,
}: {
  book: BookCardData;
  href: string;
  derived: ReturnType<typeof useDerivedBookFields>;
}) {
  const { title, coverId } = book;
  return (
    <Link
      href={href}
      className="border-border bg-card animate-in fade-in group flex cursor-pointer items-center gap-3 rounded-lg border p-2"
      aria-label={`${title} - ${derived.authorNames}`}
    >
      <BookCover
        title={title}
        coverId={coverId}
        sizeProps={{ width: 48, height: 72 }}
        className="h-auto w-12 shrink-0 rounded"
      />
      <div className="min-w-0 flex-1">
        <p className="text-foreground line-clamp-1 text-sm font-medium">{title}</p>
        <p className="text-muted-foreground line-clamp-1 text-xs">{derived.authorNames}</p>
      </div>

      {derived.seriesLabel && (
        <div className="hidden shrink-0 sm:block">
          <SeriesBadge label={derived.seriesLabel} className="text-xs" />
        </div>
      )}

      {derived.meta && <p className="text-muted-foreground hidden shrink-0 text-xs sm:block">{derived.meta}</p>}
    </Link>
  );
}

function GridCard({
  book,
  href,
  derived,
}: {
  book: BookCardData;
  href: string;
  derived: ReturnType<typeof useDerivedBookFields>;
}) {
  const { title, subtitle, coverId } = book;
  return (
    <Link
      href={href}
      className={cn(
        "border-border bg-card animate-in fade-in group flex cursor-pointer flex-row gap-2.5 rounded-lg border p-2 sm:flex-col sm:gap-2",
        "focus-visible:ring-ring focus:outline-none focus-visible:ring-2",
      )}
      aria-label={`${title} - ${derived.authorNames}`}
    >
      <BookCover
        title={title}
        subtitle={subtitle}
        coverId={coverId}
        sizeProps={{ width: 216, height: 324 }}
        className="h-auto w-full max-w-2/5 rounded sm:max-w-full"
      />
      <div className="flex flex-col">
        {derived.seriesLabel && (
          <div className="mb-1">
            <SeriesBadge label={derived.seriesLabel} />
          </div>
        )}

        <p className="text-foreground line-clamp-2 text-sm font-medium text-ellipsis whitespace-pre-wrap">{title}</p>

        {subtitle && (
          <p className="text-foreground/90 line-clamp-2 text-xs font-medium text-ellipsis whitespace-pre-wrap">
            {subtitle}
          </p>
        )}

        <p className="text-muted-foreground mt-1 line-clamp-1 text-xs text-ellipsis">{derived.authorNames}</p>

        {derived.meta && <p className="text-muted-foreground mt-1 text-xs">{derived.meta}</p>}
      </div>
    </Link>
  );
}

export function BookCard({ book, displayMode = "default" }: BookCardProps) {
  const derived = useDerivedBookFields(book);
  const href = `/browse/books/${book.slug}`;

  switch (displayMode) {
    case "compact":
      return <CompactCard book={book} href={href} derived={derived} />;
    case "cover":
      return <CoverOnlyCard book={book} href={href} derived={derived} />;
    case "list":
      return <ListCard book={book} href={href} derived={derived} />;
    default:
      return <GridCard book={book} href={href} derived={derived} />;
  }
}
