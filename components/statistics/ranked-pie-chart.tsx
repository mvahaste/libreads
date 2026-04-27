"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";

type PieChartItem = {
  key: string;
  label: string;
  value: number;
  fill?: string;
};

type RankedPieChartProps = {
  title: string;
  description?: string;
  data: PieChartItem[];
  seriesLabel: string;
};

const DEFAULT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

function buildPieChartConfig(data: PieChartItem[], seriesLabel: string): ChartConfig {
  return {
    value: { label: seriesLabel },
    ...Object.fromEntries(
      data.map((item) => [
        item.key,
        {
          label: item.label,
          color: item.fill ?? "var(--chart-1)",
        },
      ]),
    ),
  } satisfies ChartConfig;
}

export function RankedPieChart({ title, description, data, seriesLabel }: RankedPieChartProps) {
  const chartData = data.slice(0, 6).map((item, index) => ({
    ...item,
    fill: item.fill ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  const chartConfig = buildPieChartConfig(chartData, seriesLabel);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>

      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-62.5">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel={false} />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="label"
              labelLine={false}
              label={({ payload, cx, cy, midAngle, innerRadius, outerRadius }) => {
                if (midAngle == null) return null;
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.725;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);

                return (
                  <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-card font-bold">
                    {payload.value}
                  </text>
                );
              }}
            />
            <ChartLegend
              content={<ChartLegendContent nameKey="key" />}
              className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
