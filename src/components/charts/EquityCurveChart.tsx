"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EquityPoint } from "@/lib/charts/portfolioAnalytics";
import { STARTING_BALANCE } from "@/lib/mockData";
import { card, cardPadding } from "@/lib/ui/classes";
import { chartGridStroke, chartReferenceStroke, chartTickFill } from "@/lib/ui/chartTheme";
import { formatDate } from "@/lib/utils";
import { ChartContainer } from "./ChartContainer";
import { formatCompactEuroAxis, PremiumChartTooltip } from "./ChartTooltips";

interface EquityCurveChartProps {
  data: EquityPoint[];
  isMockData?: boolean;
}

export function EquityCurveChart({ data, isMockData = false }: EquityCurveChartProps) {
  const chartData = useMemo(
    () =>
      data.map((point) => ({
        ...point,
        displayDate: point.label === "Today" ? "Today" : formatDate(point.date),
      })),
    [data],
  );

  return (
    <div className={`flex min-h-[420px] flex-col ${card} ${cardPadding}`}>
      <h3 className="text-sm font-semibold tracking-tight text-slate-100">
        Portfolio Performance
      </h3>
      <p className="mt-1.5 text-xs font-normal text-slate-400">
        {isMockData
          ? "Simulated equity trend based on current portfolio value"
          : "Equity curve from transaction history"}
      </p>
      <ChartContainer>
        <AreaChart data={chartData} margin={{ top: 16, right: 12, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="equityAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
              <stop offset="85%" stopColor="#10b981" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke={chartGridStroke} strokeDasharray="3 3" vertical={false} />

          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 11, fill: chartTickFill }}
            axisLine={{ stroke: chartGridStroke }}
            tickLine={false}
            interval="preserveStartEnd"
          />

          <YAxis
            tick={{ fontSize: 11, fill: chartTickFill }}
            axisLine={false}
            tickLine={false}
            width={56}
            domain={["auto", "auto"]}
            tickFormatter={formatCompactEuroAxis}
          />

          <ReferenceLine
            y={STARTING_BALANCE}
            stroke={chartReferenceStroke}
            strokeDasharray="3 3"
            strokeWidth={1.5}
            label={{
              value: "Starting balance",
              position: "insideTopRight",
              fill: chartTickFill,
              fontSize: 10,
            }}
          />

          <Tooltip
            content={
              <PremiumChartTooltip valueLabel="Portfolio value" valueColor="#10b981" />
            }
            cursor={{ stroke: chartGridStroke, strokeWidth: 1, strokeDasharray: "3 3" }}
          />

          <Area
            type="monotone"
            dataKey="equity"
            stroke="#10b981"
            strokeWidth={2.5}
            fill="url(#equityAreaGradient)"
            dot={false}
            activeDot={{
              r: 5,
              fill: "#10b981",
              stroke: "#0f172a",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
