"use client";

import { useMemo } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EquityPoint } from "@/lib/charts/portfolioAnalytics";
import { formatCurrency, formatDate } from "@/lib/utils";

interface EquityCurveChartProps {
  data: EquityPoint[];
}

export function EquityCurveChart({ data }: EquityCurveChartProps) {
  const chartData = useMemo(
    () =>
      data.map((point) => ({
        ...point,
        displayDate:
          point.label === "Today" ? "Today" : formatDate(point.date),
      })),
    [data],
  );

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Portfolio Performance
      </h3>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Equity curve from transaction history
      </p>
      <div className="mt-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 11, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
              width={56}
              tickFormatter={(value: number) =>
                `€${(value / 1000).toFixed(value >= 1000 ? 1 : 0)}${value >= 1000 ? "k" : ""}`
              }
            />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value)), "Equity"]}
              labelFormatter={(label) => String(label)}
              contentStyle={{
                borderRadius: "0.75rem",
                border: "1px solid #e4e4e7",
                fontSize: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="equity"
              stroke="#059669"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#059669" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
