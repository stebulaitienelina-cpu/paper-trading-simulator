"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyPnLPoint } from "@/lib/charts/portfolioAnalytics";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DailyPnLChartProps {
  data: DailyPnLPoint[];
}

export function DailyPnLChart({ data }: DailyPnLChartProps) {
  const chartData = data.map((point) => ({
    ...point,
    displayDate: formatDate(point.date),
  }));

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Daily P/L
      </h3>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Realized profit & loss from sell trades
      </p>
      <div className="mt-4 h-56 w-full">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-zinc-500 dark:text-zinc-400">
            No realized P/L yet — sell a position to see daily results.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                tickFormatter={(value: number) => `€${value}`}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), "P/L"]}
                labelFormatter={(label) => String(label)}
                contentStyle={{
                  borderRadius: "0.75rem",
                  border: "1px solid #e4e4e7",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                {chartData.map((point) => (
                  <Cell
                    key={point.date}
                    fill={point.pnl >= 0 ? "#059669" : "#ef4444"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
