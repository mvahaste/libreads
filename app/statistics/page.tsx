import StatisticsPage from "@/components/statistics/statistics-page";
import { BookType, ReadingStatus } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth/auth";
import { caller } from "@/lib/trpc/server";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/auth/sign-in");

  const [overallStats, tStats, tReadingStatus, tBookTypes] = await Promise.all([
    caller.books.overallUserStats(),
    getTranslations("statistics"),
    getTranslations("common.readingStatus"),
    getTranslations("common.bookTypes"),
  ]);

  const statusLabels: Record<ReadingStatus, string> = {
    [ReadingStatus.WANT_TO_READ]: tReadingStatus("WANT_TO_READ"),
    [ReadingStatus.READING]: tReadingStatus("READING"),
    [ReadingStatus.COMPLETED]: tReadingStatus("COMPLETED"),
    [ReadingStatus.PAUSED]: tReadingStatus("PAUSED"),
    [ReadingStatus.ABANDONED]: tReadingStatus("ABANDONED"),
  };

  const typeLabels: Record<BookType, string> = {
    [BookType.PHYSICAL]: tBookTypes("PHYSICAL"),
    [BookType.EBOOK]: tBookTypes("EBOOK"),
    [BookType.AUDIOBOOK]: tBookTypes("AUDIOBOOK"),
  };

  return (
    <StatisticsPage
      overallStats={overallStats}
      statusLabels={statusLabels}
      typeLabels={typeLabels}
      labels={{
        pageTitle: tStats("title"),
        pageDescription: tStats("description"),
        cards: {
          books: tStats("cards.books"),
          pages: tStats("cards.pages"),
          time: tStats("cards.time"),
          rating: tStats("cards.rating"),
          ratingNoData: tStats("cards.ratingNoData"),
        },
        charts: {
          seriesLabel: tStats("charts.seriesLabel"),
          booksByStatus: {
            title: tStats("charts.booksByStatus.title"),
            description: tStats("charts.booksByStatus.description"),
          },
          booksByType: {
            title: tStats("charts.booksByType.title"),
            description: tStats("charts.booksByType.description"),
          },
          topAuthors: {
            title: tStats("charts.topAuthors.title"),
            description: tStats("charts.topAuthors.description"),
          },
          topGenres: {
            title: tStats("charts.topGenres.title"),
            description: tStats("charts.topGenres.description"),
          },
          topSeries: {
            title: tStats("charts.topSeries.title"),
            description: tStats("charts.topSeries.description"),
          },
          topPublishers: {
            title: tStats("charts.topPublishers.title"),
            description: tStats("charts.topPublishers.description"),
          },
          topTags: {
            title: tStats("charts.topTags.title"),
            description: tStats("charts.topTags.description"),
          },
        },
      }}
    />
  );
}
