import BookProgressDialog from "@/components/browse/books/book-progress-dialog";
import BookRatingDialog from "@/components/browse/books/book-rating-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CoverImage from "@/components/ui/cover-image";
import PageHeader from "@/components/ui/page-header";
import { READING_STATUS_COLORS } from "@/lib/books/status-colors";
import { DashboardSummaryOutput } from "@/lib/trpc/routers/books";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";

interface DashboardPageProps {
  summary: DashboardSummaryOutput;
  labels: {
    title: string;
    description: string;
    currentlyReading: {
      title: string;
      description: string;
      empty: string;
    };
    upNext: {
      title: string;
      description: string;
      empty: string;
      addedOn: string;
    };
    awaitingRating: {
      title: string;
      description: string;
      empty: string;
      finishedOn: string;
    };
    recentlyFinished: {
      title: string;
      description: string;
      empty: string;
      finishedOn: string;
    };
    recentActivity: {
      title: string;
      description: string;
      empty: string;
      statusLabels: Record<string, string>;
    };
    topTags: {
      title: string;
      description: string;
      empty: string;
    };
  };
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatShortDateAndTime(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
}

function BookMeta({ authors }: { authors: Array<{ id: string; name: string }> }) {
  if (authors.length === 0) {
    return null;
  }

  return <p className="text-muted-foreground line-clamp-1 text-xs">{authors.map((a) => a.name).join(", ")}</p>;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-muted-foreground border-border/60 bg-muted/30 grid h-full w-full items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center text-sm">
      {text}
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-full">{children}</CardContent>
    </Card>
  );
}

export default function DashboardPage({ summary, labels }: DashboardPageProps) {
  return (
    <div>
      <PageHeader title={labels.title} description={labels.description} />

      <div className="space-y-4">
        <SectionCard title={labels.currentlyReading.title} description={labels.currentlyReading.description}>
          {summary.currentlyReading.length === 0 ? (
            <EmptyState text={labels.currentlyReading.empty} />
          ) : (
            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
              {summary.currentlyReading.map((entry) => (
                <div key={entry.id} className="bg-muted/10 border-border max-w-96 min-w-72 rounded-lg border p-3">
                  <div className="flex gap-3">
                    <Link href={`/browse/books/${entry.book.slug}`} className="shrink-0">
                      <CoverImage
                        width={108}
                        height={162}
                        title={entry.book.title}
                        subtitle={entry.book.subtitle ?? undefined}
                        localCoverId={entry.book.coverId ?? undefined}
                        className="h-auto w-16 rounded-sm"
                      />
                    </Link>

                    <div className="min-w-0 flex-1 space-y-2">
                      <Link href={`/browse/books/${entry.book.slug}`} className="block">
                        <p className="mb-1 line-clamp-2 text-sm font-medium">{entry.book.title}</p>
                        <BookMeta authors={entry.book.authors} />
                      </Link>

                      <BookProgressDialog
                        bookId={entry.book.id}
                        progressType={entry.progressType}
                        currentProgress={entry.progress}
                        pageCount={entry.book.pageCount}
                        audioSeconds={entry.book.audioSeconds}
                        showProgressLabel={true}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title={labels.upNext.title} description={labels.upNext.description}>
            {summary.upNext.length === 0 ? (
              <EmptyState text={labels.upNext.empty} />
            ) : (
              <div className="space-y-2">
                {summary.upNext.map((entry) => (
                  <div key={entry.id} className="border-border/60 bg-muted/20 rounded-lg border p-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <Link href={`/browse/books/${entry.book.slug}`} className="shrink-0">
                        <CoverImage
                          width={72}
                          height={108}
                          title={entry.book.title}
                          subtitle={entry.book.subtitle ?? undefined}
                          localCoverId={entry.book.coverId ?? undefined}
                          className="h-auto w-12 rounded-sm"
                        />
                      </Link>

                      <Link href={`/browse/books/${entry.book.slug}`} className="flex flex-col gap-0.5">
                        <p className="line-clamp-2 text-sm font-medium">{entry.book.title}</p>
                        <BookMeta authors={entry.book.authors} />
                        <p className="text-muted-foreground text-xs">
                          {labels.upNext.addedOn}: {formatShortDate(entry.addedAt)}
                        </p>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title={labels.awaitingRating.title} description={labels.awaitingRating.description}>
            {summary.awaitingRating.length === 0 ? (
              <EmptyState text={labels.awaitingRating.empty} />
            ) : (
              <div className="space-y-2">
                {summary.awaitingRating.map((entry) => (
                  <div
                    key={entry.book.id}
                    className="border-border/60 bg-muted/20 flex flex-row justify-between rounded-lg border p-3"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <Link href={`/browse/books/${entry.book.slug}`} className="shrink-0">
                        <CoverImage
                          width={72}
                          height={108}
                          title={entry.book.title}
                          subtitle={entry.book.subtitle ?? undefined}
                          localCoverId={entry.book.coverId ?? undefined}
                          className="h-auto w-12 rounded-sm"
                        />
                      </Link>

                      <Link href={`/browse/books/${entry.book.slug}`} className="flex flex-col gap-0.5">
                        <p className="line-clamp-2 text-sm font-medium">{entry.book.title}</p>
                        <BookMeta authors={entry.book.authors} />
                        <p className="text-muted-foreground text-xs">
                          {labels.awaitingRating.finishedOn}: {formatShortDate(entry.finishedAt)}
                        </p>
                      </Link>
                    </div>

                    <BookRatingDialog bookId={entry.book.id} initialRating={null} className="hidden sm:flex" />
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard title={labels.recentlyFinished.title} description={labels.recentlyFinished.description}>
          {summary.recentlyFinished.length === 0 ? (
            <EmptyState text={labels.recentlyFinished.empty} />
          ) : (
            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
              {summary.recentlyFinished.map((entry) => (
                <div
                  key={entry.book.id}
                  className="border-border/60 bg-muted/20 max-w-96 min-w-72 rounded-lg border p-3"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <Link href={`/browse/books/${entry.book.slug}`} className="shrink-0">
                      <CoverImage
                        width={72}
                        height={108}
                        title={entry.book.title}
                        subtitle={entry.book.subtitle ?? undefined}
                        localCoverId={entry.book.coverId ?? undefined}
                        className="h-auto w-12 rounded-sm"
                      />
                    </Link>

                    <Link href={`/browse/books/${entry.book.slug}`} className="flex flex-col gap-0.5">
                      <p className="line-clamp-2 text-sm font-medium">{entry.book.title}</p>
                      <BookMeta authors={entry.book.authors} />
                      <p className="text-muted-foreground text-xs">
                        {labels.recentlyFinished.finishedOn}: {formatShortDate(entry.finishedAt)}
                      </p>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title={labels.recentActivity.title} description={labels.recentActivity.description}>
          {summary.recentActivity.length === 0 ? (
            <EmptyState text={labels.recentActivity.empty} />
          ) : (
            <div className="space-y-2">
              {summary.recentActivity.map((entry) => (
                <div
                  key={`${entry.status}:${entry.book.slug}:${entry.at}`}
                  className="border-border/60 bg-muted/20 flex flex-col items-start justify-between gap-1.5 rounded-lg border p-3 md:flex-row md:items-center md:gap-3"
                >
                  <div className="flex min-w-0 flex-col items-start gap-1.5 md:flex-row md:items-center md:gap-3">
                    <Badge variant="ghost" className={cn("h-6 text-xs", READING_STATUS_COLORS[entry.status])}>
                      {labels.recentActivity.statusLabels[entry.status] ?? entry.status}
                    </Badge>
                    <Link href={`/browse/books/${entry.book.slug}`} className="min-w-0 text-sm font-medium">
                      <span className="line-clamp-1">{entry.book.title}</span>
                    </Link>
                  </div>
                  <p className="text-muted-foreground shrink-0 text-xs">{formatShortDateAndTime(entry.at)}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title={labels.topTags.title} description={labels.topTags.description}>
          {summary.topTags.length === 0 ? (
            <EmptyState text={labels.topTags.empty} />
          ) : (
            <div className="-mx-4 flex flex-wrap gap-2 overflow-x-auto px-4 pb-1">
              {summary.topTags.map((tag) => (
                <Badge key={tag!.id} asChild variant="secondary" className="h-7 px-3 text-sm">
                  <Link href={`/browse/my-books?tag=${encodeURIComponent(tag!.name)}`}>{tag!.name}</Link>
                </Badge>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
