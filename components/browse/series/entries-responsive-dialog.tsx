"use client";

import CoverImage from "@/components/ui/cover-image";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import type { SeriesDetailsOutput } from "@/lib/trpc/routers/books";
import { useTranslations } from "next-intl";
import Link from "next/link";

export function SeriesEntriesResponsiveDialog({ group }: { group: SeriesDetailsOutput["groupedBooks"][number] }) {
  const t = useTranslations("browse.detail");

  return (
    <ResponsiveDialog>
      <ResponsiveDialogTrigger asChild>
        <button
          type="button"
          className={`${group.books.length >= 3 ? "mb-8" : group.books.length >= 2 ? "mb-5" : ""} border-border bg-card group relative flex w-full cursor-pointer items-center gap-4 rounded-lg border p-3`}
        >
          <div className="text-muted-foreground w-8 shrink-0 text-center text-sm font-bold">
            {group.position ? `#${group.position}` : "-"}
          </div>
          {group.books[0].coverId && (
            <CoverImage
              width={60}
              height={90}
              title={group.books[0].title}
              localCoverId={group.books[0].coverId}
              className="h-auto w-12 shrink-0 rounded transition-opacity group-hover:opacity-75"
            />
          )}
          <div className="text-left">
            <p className="text-foreground line-clamp-2 text-sm font-medium">{group.books[0].title}</p>
            <p className="text-foreground/80 line-clamp-1 text-xs">{group.books[0].subtitle}</p>
            <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">{group.books[0].authors.join(", ")}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">{group.books[0].publishYear}</p>
          </div>

          {/* If two books with the same position, show a second fake card behind first one */}
          {/* If three or more books, then show a third one as well */}
          {group.books.length >= 2 && (
            <div className="border-border bg-card absolute right-3 -bottom-3 left-3 -z-10 flex cursor-pointer items-center gap-4 rounded-lg border p-3 opacity-90 transition-transform hover:scale-102" />
          )}
          {group.books.length >= 3 && (
            <div className="border-border bg-card absolute right-6 -bottom-6 left-6 -z-20 flex cursor-pointer items-center gap-4 rounded-lg border p-3 opacity-80 transition-transform hover:scale-102" />
          )}
        </button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t("all-editions-for-entry")}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{t("all-editions-for-entry-description")}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="max-h-[50vh] space-y-2 overflow-y-auto pb-4 sm:pb-0">
          {group.books.map((book) => (
            <SeriesEntryCard key={book.id} book={book} position={group.position} />
          ))}
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

export function SeriesEntryCard({
  book,
  position,
}: {
  book: SeriesDetailsOutput["groupedBooks"][number]["books"][number];
  position: number;
}) {
  return (
    <Link
      key={book.id}
      href={`/browse/books/${book.slug}`}
      className="border-border bg-card group relative flex cursor-pointer items-center gap-4 rounded-lg border p-3"
    >
      <div className="text-muted-foreground w-8 shrink-0 text-center text-sm font-bold">
        {position ? `#${position}` : "-"}
      </div>
      {book.coverId && (
        <CoverImage
          width={60}
          height={90}
          title={book.title}
          localCoverId={book.coverId || undefined}
          className="h-auto w-12 shrink-0 rounded transition-opacity group-hover:opacity-75"
        />
      )}
      <div>
        <p className="text-foreground line-clamp-2 text-sm font-medium">{book.title}</p>
        {book.subtitle && <p className="text-foreground/80 line-clamp-1 text-xs">{book.subtitle}</p>}
        <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">{book.authors.join(", ")}</p>
        <p className="text-muted-foreground mt-0.5 text-xs">{book.publishYear}</p>
      </div>
    </Link>
  );
}
