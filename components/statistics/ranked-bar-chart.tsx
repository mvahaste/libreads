"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";

type RankedChartItem = {
  key: string;
  label: string;
  value: number;
  fill?: string;
};

type RankedBarChartProps = {
  title: string;
  description?: string;
  data: RankedChartItem[];
  seriesLabel: string;
};

const DEFAULT_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function buildChartConfig(data: RankedChartItem[], seriesLabel: string): ChartConfig {
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

export function RankedBarChart({ title, description, data, seriesLabel }: RankedBarChartProps) {
  const chartData = data.slice(0, 5).map((item, index) => ({
    ...item,
    fill: item.fill ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  const chartConfig = buildChartConfig(chartData, seriesLabel);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData} layout="horizontal" margin={{ left: 0 }}>
            <XAxis
              dataKey="key"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => chartConfig[value as keyof typeof chartConfig]?.label ?? value}
            />
            <YAxis dataKey="value" type="number" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel={false} />} />
            <Bar dataKey="value" radius={5}>
              <LabelList dataKey="value" position="insideTop" offset={16} className="fill-[#f3f2f1] font-bold" />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
