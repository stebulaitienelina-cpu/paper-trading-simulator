"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { AllocationSlice } from "@/lib/charts/portfolioAnalytics";
import { formatCurrency } from "@/lib/utils";

interface AllocationChartProps {
  data: AllocationSlice[];
}

export function AllocationChart({ data }: AllocationChartProps) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Asset Allocation
      </h3>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Cash vs. stock holdings
      </p>
      <div className="mt-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={78}
              paddingAngle={3}
            >
              {data.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                formatCurrency(Number(value)),
                String(name),
              ]}
              contentStyle={{
                borderRadius: "0.75rem",
                border: "1px solid #e4e4e7",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-4">
        {data.map((slice) => (
          <div key={slice.name} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span className="text-zinc-600 dark:text-zinc-300">
              {slice.name}: {formatCurrency(slice.value)}
              {total > 0
                ? ` (${((slice.value / total) * 100).toFixed(1)}%)`
                : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
