import PageHeader from "@/components/ui/page-header";
import StatCard from "@/components/ui/stat-card";
import { BookType, ReadingStatus } from "@/generated/prisma/enums";
import { OverallUserStatsOutput } from "@/lib/trpc/routers/books";
import { StatisticsTopItem } from "@/lib/trpc/routers/books/procedures/statistics";
import { formatDurationForDisplay } from "@/lib/utils/duration";
import { LucideAudioLines, LucideBookOpen, LucideStar, LucideStickyNote } from "lucide-react";
import { ReactNode } from "react";
import slug from "slug";

import { RankedBarChart } from "./ranked-bar-chart";
import { RankedPieChart } from "./ranked-pie-chart";

export type UserStatKey = "books" | "pages" | "time" | "rating";

const statIcons: Record<UserStatKey, ReactNode> = {
  books: <LucideBookOpen className="text-primary size-5" />,
  pages: <LucideStickyNote className="text-primary size-5" />,
  time: <LucideAudioLines className="text-primary size-5" />,
  rating: <LucideStar className="text-primary size-5" />,
};

interface StatisticsPageProps {
  overallStats: OverallUserStatsOutput;
  statusLabels: Record<ReadingStatus, string>;
  typeLabels: Record<BookType, string>;
  labels: {
    pageTitle: string;
    pageDescription: string;
    cards: Record<UserStatKey, string> & { ratingNoData: string };
    charts: {
      seriesLabel: string;
      booksByStatus: {
        title: string;
        description: string;
      };
      booksByType: {
        title: string;
        description: string;
      };
      topAuthors: {
        title: string;
        description: string;
      };
      topGenres: {
        title: string;
        description: string;
      };
      topSeries: {
        title: string;
        description: string;
      };
      topPublishers: {
        title: string;
        description: string;
      };
      topTags: {
        title: string;
        description: string;
      };
    };
  };
}

type ChartData = {
  key: string;
  label: string;
  value: number;
}[];

function getBarChartData(stats: StatisticsTopItem[]): ChartData {
  return stats.map((s) => ({
    key: s.slug ?? slug(s.name, { lower: true }),
    label: s.name,
    value: s.count,
  }));
}

function getChartsWithData(charts: unknown[][]) {
  let count = 0;

  for (const chart of charts) {
    if (chart.length > 0) count += 1;
  }

  return count;
}

// TODO: Get better colors for `--chart-[n]` in globals.css
export default function StatisticsPage({ overallStats, statusLabels, typeLabels, labels }: StatisticsPageProps) {
  const booksByStatusData = overallStats.booksByStatus
    .filter((b): b is { status: ReadingStatus; count: number } => b.status !== null)
    .map((b) => ({
      key: b.status,
      label: statusLabels[b.status],
      value: b.count,
    }));

  const booksByTypeData = overallStats.booksByType
    .filter((b): b is { type: BookType; count: number } => b.type !== null)
    .map((b) => ({
      key: b.type,
      label: typeLabels[b.type],
      value: b.count,
    }));

  const authorsData = getBarChartData(overallStats.topAuthors);
  const seriesData = getBarChartData(overallStats.topSeries);
  const genresData = getBarChartData(overallStats.topGenres);
  const publishersData = getBarChartData(overallStats.topPublishers);
  const tagsData = getBarChartData(overallStats.topTags);

  const chartsWithData = getChartsWithData([
    booksByStatusData,
    booksByTypeData,
    authorsData,
    seriesData,
    genresData,
    publishersData,
    tagsData,
  ]);

  return (
    <div>
      <PageHeader title={labels.pageTitle} description={labels.pageDescription} />

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={statIcons["books"]}
            label={labels.cards.books}
            value={overallStats.totalBooks.toLocaleString()}
          />
          <StatCard
            icon={statIcons["pages"]}
            label={labels.cards.pages}
            value={(overallStats.pagesRead || 0).toLocaleString()}
          />
          <StatCard
            icon={statIcons["time"]}
            label={labels.cards.time}
            value={formatDurationForDisplay(overallStats.secondsListened || 0)}
          />
          <StatCard
            icon={statIcons["rating"]}
            label={labels.cards.rating}
            value={overallStats.averageRating?.toLocaleString()}
            noValueLabel={labels.cards.ratingNoData}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {booksByStatusData.length > 0 && (
            <RankedPieChart
              title={labels.charts.booksByStatus.title}
              description={labels.charts.booksByStatus.description}
              data={booksByStatusData}
              seriesLabel={labels.charts.seriesLabel}
            />
          )}

          {booksByTypeData.length > 0 && (
            <RankedPieChart
              title={labels.charts.booksByType.title}
              description={labels.charts.booksByType.description}
              data={booksByTypeData}
              seriesLabel={labels.charts.seriesLabel}
            />
          )}

          {authorsData.length > 0 && (
            <RankedBarChart
              title={labels.charts.topAuthors.title}
              description={labels.charts.topAuthors.description}
              data={authorsData}
              seriesLabel={labels.charts.seriesLabel}
            />
          )}

          {genresData.length > 0 && (
            <RankedBarChart
              title={labels.charts.topGenres.title}
              description={labels.charts.topGenres.description}
              data={genresData}
              seriesLabel={labels.charts.seriesLabel}
            />
          )}

          {seriesData.length > 0 && (
            <RankedBarChart
              title={labels.charts.topSeries.title}
              description={labels.charts.topSeries.description}
              data={seriesData}
              seriesLabel={labels.charts.seriesLabel}
            />
          )}

          {publishersData.length > 0 && (
            <RankedBarChart
              title={labels.charts.topPublishers.title}
              description={labels.charts.topPublishers.description}
              data={publishersData}
              seriesLabel={labels.charts.seriesLabel}
            />
          )}

          {tagsData.length > 0 && (
            <RankedBarChart
              title={labels.charts.topTags.title}
              description={labels.charts.topTags.description}
              data={tagsData}
              seriesLabel={labels.charts.seriesLabel}
            />
          )}

          {chartsWithData % 2 !== 0 && (
            <div className="border-foreground/10 bg-card/50 text-card-foreground hidden items-center justify-center rounded-xl border border-dashed text-sm lg:grid">
              <p className="text-muted-foreground font-mono text-xl opacity-50">₍˄·͈༝·͈˄₎◞ ̑̑</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
