import notFound from "@/app/not-found";
import { SeriesEntriesResponsiveDialog, SeriesEntryCard } from "@/components/browse/series/entries-responsive-dialog";
import { Separator } from "@/components/ui/separator";
import { caller } from "@/lib/trpc/server";
import { TRPCError } from "@trpc/server";
import { getTranslations } from "next-intl/server";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const series = await caller.books.seriesDetails({ slug }).catch((e) => {
    if (e instanceof TRPCError && e.code === "NOT_FOUND") {
      return null;
    }

    throw e;
  });

  if (!series) return notFound();

  const tCount = await getTranslations("browse.count");

  return (
    <div>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold">{series.name}</h1>
          {series.description && <p className="text-muted-foreground mt-1 text-sm">{series.description}</p>}
          <p className="text-muted-foreground mt-1 text-sm">{tCount("entry", { count: series.entryCount })}</p>
        </div>

        <Separator />

        <div className="space-y-2">
          {series.groupedBooks.map((group) => {
            if (group.books.length > 1) {
              return <SeriesEntriesResponsiveDialog key={group.groupKey} group={group} />;
            } else {
              return <SeriesEntryCard key={group.groupKey} book={group.books[0]} position={group.position} />;
            }
          })}
        </div>
      </div>
    </div>
  );
}
