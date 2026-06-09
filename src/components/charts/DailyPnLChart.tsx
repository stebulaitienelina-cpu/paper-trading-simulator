"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyPnLPoint } from "@/lib/charts/portfolioAnalytics";
import { card, cardPadding } from "@/lib/ui/classes";
import { chartGridStroke, chartReferenceStroke, chartTickFill } from "@/lib/ui/chartTheme";
import { formatDate } from "@/lib/utils";
import { ChartContainer } from "./ChartContainer";
import { DailyPnLTooltip, formatSignedEuroAxis } from "./ChartTooltips";

interface DailyPnLChartProps {
  data: DailyPnLPoint[];
  isMockData?: boolean;
}

export function DailyPnLChart({ data, isMockData = false }: DailyPnLChartProps) {
  const chartData = useMemo(
    () =>
      data.map((point) => ({
        ...point,
        displayDate: formatDate(point.date),
      })),
    [data],
  );

  const yDomain = useMemo((): [number, number] => {
    if (chartData.length === 0) {
      return [-100, 100];
    }

    const values = chartData.map((point) => point.pnl);
    const min = Math.min(0, ...values);
    const max = Math.max(0, ...values);
    const span = max - min || 100;
    const padding = Math.max(span * 0.15, 25);

    return [min - padding, max + padding];
  }, [chartData]);

  return (
    <div className={`flex min-h-[420px] flex-col ${card} ${cardPadding}`}>
      <h3 className="text-sm font-semibold tracking-tight text-slate-100">Daily P/L</h3>
      <p className="mt-1.5 text-xs font-normal text-slate-400">
        {isMockData
          ? "Sample daily P/L for presentation preview"
          : "Realized profit & loss from sell trades"}
      </p>
      <ChartContainer>
        <BarChart
          data={chartData}
          margin={{ top: 16, right: 12, left: 4, bottom: 4 }}
          barCategoryGap="20%"
        >
          <defs>
            <linearGradient id="pnlProfitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.35} />
            </linearGradient>
            <linearGradient id="pnlLossGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.95} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke={chartGridStroke} strokeDasharray="3 3" vertical={false} />

          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 11, fill: chartTickFill }}
            axisLine={{ stroke: chartGridStroke }}
            tickLine={false}
          />

          <YAxis
            tick={{ fontSize: 11, fill: chartTickFill }}
            axisLine={false}
            tickLine={false}
            width={64}
            domain={yDomain}
            tickFormatter={formatSignedEuroAxis}
          />

          <ReferenceLine
            y={0}
            stroke={chartReferenceStroke}
            strokeDasharray="3 3"
            strokeWidth={1.5}
          />

          <Tooltip content={<DailyPnLTooltip />} cursor={{ fill: "rgba(148, 163, 184, 0.08)" }} />

          <Bar dataKey="pnl" maxBarSize={48} radius={[6, 6, 6, 6]}>
            {chartData.map((point) => (
              <Cell
                key={point.date}
                fill={
                  point.pnl >= 0 ? "url(#pnlProfitGradient)" : "url(#pnlLossGradient)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
