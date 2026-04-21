import { AuthorList } from "@/components/browse/books/author-list";
import { BookDescription } from "@/components/browse/books/book-description";
import BookNotesDialog from "@/components/browse/books/book-notes-dialog";
import BookProgressDialog from "@/components/browse/books/book-progress-dialog";
import BookRatingDialog from "@/components/browse/books/book-rating-dialog";
import BookReadThroughHistory from "@/components/browse/books/book-read-through-history";
import BookStatusButton from "@/components/browse/books/book-status-button";
import BookTagsCombobox from "@/components/browse/books/book-tags-combobox";
import { MetaLabel } from "@/components/browse/books/meta-label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CoverImage from "@/components/ui/cover-image";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth/auth";
import { caller } from "@/lib/trpc/server";
import { secondsToHoursMinutesSeconds } from "@/lib/utils/duration";
import { TRPCError } from "@trpc/server";
import { LucidePencil } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const book = await caller.books.bookDetails({ slug }).catch((e) => {
    if (e instanceof TRPCError && e.code === "NOT_FOUND") {
      return null;
    }

    throw e;
  });

  if (!book) return notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  const canEditBook = Boolean(session?.user.isAdmin);

  const t = await getTranslations("browse.detail");

  const metaParts = [
    book.publishYear,
    book.format,
    book.pageCount ? `${book.pageCount} ${t("pages").toLowerCase()}` : null,
    book.audioSeconds != null ? secondsToHoursMinutesSeconds(book.audioSeconds) : null,
  ].filter(Boolean);
  const hasUserNotes = Boolean(book.userNotes?.trim());
  const hasReadThroughs = book.userReadThroughs.length > 0;
  const canManageTags = Boolean(book.userStatus) || book.userTags.length > 0;
  const canManageNotes = Boolean(book.userStatus) || hasUserNotes;
  const hasUserContent = hasUserNotes || hasReadThroughs;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <CoverImage
          width={512}
          height={512}
          localCoverId={book.coverId || undefined}
          title={book.title || t("unknown-title")}
          className="mx-auto h-full w-full max-w-1/2 sm:mx-0 sm:max-w-40"
        />
        <div className="flex flex-1 flex-col gap-2">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-xl font-bold">{book.title}</h1>
              {canEditBook && (
                <Button asChild variant="outline" size="icon" className="shrink-0">
                  <Link href={`/browse/books/${book.slug}/edit`}>
                    <LucidePencil className="size-4" />
                    <span className="sr-only">{t("edit-book")}</span>
                  </Link>
                </Button>
              )}
            </div>
            {book.subtitle && <h2 className="text-muted-foreground text-lg">{book.subtitle}</h2>}
            <AuthorList authors={book.authors} />
          </div>

          {book.series.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {book.series.map((s) => (
                <Link key={s.id} href={`/browse/series/${s.slug}`}>
                  <Badge variant="secondary">
                    {s.name}
                    {s.position != null && ` #${s.position}`}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {metaParts.length > 0 && <p className="text-muted-foreground text-sm">{metaParts.join(" · ")}</p>}

          <div className="flex w-full flex-wrap gap-3 sm:max-w-lg">
            <BookStatusButton bookId={book.id} initialStatus={book.userStatus} />
            {canManageNotes && <BookNotesDialog bookId={book.id} initialNotes={book.userNotes} />}
            {book.userStatus && <BookRatingDialog bookId={book.id} initialRating={book.userRating} />}
            {book.userStatus && (
              <BookProgressDialog
                bookId={book.id}
                progressType={book.userProgressType}
                currentProgress={book.userProgress}
                pageCount={book.pageCount}
                audioSeconds={book.audioSeconds}
                showProgressLabel={book.userStatus === "READING" || book.userStatus === "PAUSED"}
              />
            )}
            {canManageTags && <BookTagsCombobox bookId={book.id} initialTags={book.userTags} />}
          </div>
        </div>
      </div>
      {book.description && (
        <>
          <Separator />
          <section>
            <h3 className="text-muted-foreground mb-2 text-sm font-semibold">{t("description")}</h3>
            <BookDescription description={book.description} />
          </section>
        </>
      )}
      <Separator />
      <section>
        <div className="grid grid-cols-1 gap-x-8 gap-y-1.5 sm:grid-cols-2">
          <MetaLabel
            label={t("publisher")}
            value={book.publisher?.name}
            href={book.publisher ? `/browse/books?publisher=${book.publisher.slug}` : undefined}
          />
          <MetaLabel label={t("year")} value={book.publishYear} />
          <MetaLabel label={t("format")} value={book.format} href={`/browse/books?format=${book.format}`} />
          <MetaLabel label={t("pages")} value={book.pageCount} />
          <MetaLabel
            label={t("duration")}
            value={book.audioSeconds != null ? secondsToHoursMinutesSeconds(book.audioSeconds) : null}
          />
          <MetaLabel label={t("isbn13")} value={book.isbn13} />
          <MetaLabel label={t("isbn10")} value={book.isbn10} />
        </div>

        {book.genres.length > 0 && (
          <div>
            <span className="text-muted-foreground mr-2 text-sm">{t("genres")}</span>
            <div className="mt-1 inline-flex flex-wrap gap-1.5">
              {book.genres.map((genre) => (
                <Link key={genre.id} href={`/browse/books?genre=${genre.slug}`}>
                  <Badge variant="secondary">{genre.name}</Badge>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {hasUserContent && (
        <>
          <Separator />
          <section>
            <h3 className="text-muted-foreground mb-2 text-sm font-semibold">{t("activity")}</h3>
            <div className="space-y-4">
              {hasUserNotes && (
                <div>
                  <h4 className="text-muted-foreground mb-2 text-[0.625rem] font-bold tracking-wider uppercase">
                    {t("notes")}
                  </h4>
                  <BookDescription description={book.userNotes} />
                </div>
              )}
              {hasReadThroughs && <BookReadThroughHistory readThroughs={book.userReadThroughs} />}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
