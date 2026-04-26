"use client";

import PageHeader from "@/components/ui/page-header";
import StatCard from "@/components/ui/stat-card";
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

// TODO:
// - Localize
// - Get better colors for `--chart-[n]` in globals.css
export default function StatisticsPage({ overallStats }: StatisticsPageProps) {
  // TODO: Move reading status keys from browse.json to some more general place, then use them here.
  const booksByStatusData = overallStats.booksByStatus.map((b) => ({
    key: b.status!.toString(),
    label: b.status!.toString(),
    value: b.count,
  }));

  // TODO: Move book type keys from browse.json to some more general place, then use them here.
  const booksByTypeData = overallStats.booksByType.map((b) => ({
    key: b.type!.toString(),
    label: b.type!.toString(),
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
      <PageHeader title={"Statistics"} description={"I don't have a description for this yet."} />

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={statIcons["books"]} label={"Total books"} value={overallStats.totalBooks.toLocaleString()} />
          <StatCard
            icon={statIcons["pages"]}
            label={"Pages read"}
            value={(overallStats.pagesRead || 0).toLocaleString()}
          />
          <StatCard
            icon={statIcons["time"]}
            label={"Time listened"}
            value={formatDurationForDisplay(overallStats.secondsListened || 0)}
          />
          <StatCard
            icon={statIcons["rating"]}
            label={"Average rating"}
            value={overallStats.averageRating?.toLocaleString()}
            noValueLabel="Not enough data"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {booksByStatusData.length > 0 && (
            <RankedPieChart
              title="Books by Status"
              description="Your books by their statuses."
              data={booksByStatusData}
              seriesLabel="Books"
            />
          )}

          {booksByTypeData.length > 0 && (
            <RankedPieChart
              title="Books by Type"
              description="Your books by their types."
              data={booksByTypeData}
              seriesLabel="Books"
            />
          )}

          {authorsData.length > 0 && (
            <RankedBarChart
              title="Top Authors"
              description="Your most read authors."
              data={authorsData}
              seriesLabel="Books"
            />
          )}

          {genresData.length > 0 && (
            <RankedBarChart
              title="Top Genres"
              description="Your most read genres."
              data={genresData}
              seriesLabel="Books"
            />
          )}

          {seriesData.length > 0 && (
            <RankedBarChart
              title="Top Series"
              description="Your longest series."
              data={seriesData}
              seriesLabel="Books"
            />
          )}

          {publishersData.length > 0 && (
            <RankedBarChart
              title="Top Publishers"
              description="Your most read publishers."
              data={publishersData}
              seriesLabel="Books"
            />
          )}

          {tagsData.length > 0 && (
            <RankedBarChart title="Top Tags" description="Your most used tags." data={tagsData} seriesLabel="Books" />
          )}

          {chartsWithData % 2 != 0 && (
            <div className="border-foreground/10 bg-card/50 text-card-foreground hidden items-center justify-center rounded-xl border border-dashed text-sm lg:grid">
              <p className="text-muted-foreground font-mono text-xl opacity-50">₍˄·͈༝·͈˄₎◞ ̑̑</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
