"use client";

import { Cell, Pie, PieChart, Tooltip } from "recharts";
import type { AllocationSlice } from "@/lib/charts/portfolioAnalytics";
import { card, cardPadding } from "@/lib/ui/classes";
import { CHART_SEGMENT_COLORS } from "@/lib/ui/chartTheme";
import { formatCurrency } from "@/lib/utils";
import { AllocationTooltip } from "./ChartTooltips";
import { ChartContainer } from "./ChartContainer";

interface AllocationChartProps {
  data: AllocationSlice[];
}

export function AllocationChart({ data }: AllocationChartProps) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className={`flex min-h-[420px] flex-col ${card} ${cardPadding}`}>
      <h3 className="text-sm font-semibold tracking-tight text-slate-100">
        Asset Allocation
      </h3>
      <p className="mt-1.5 text-xs font-normal text-slate-400">Cash vs. stock holdings</p>
      <ChartContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={3}
            stroke="#0f172a"
            strokeWidth={2}
          >
            {data.map((slice, index) => (
              <Cell
                key={slice.name}
                fill={CHART_SEGMENT_COLORS[index % CHART_SEGMENT_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => (
              <AllocationTooltip active={active} payload={payload} total={total} />
            )}
          />
        </PieChart>
      </ChartContainer>
      <div className="mt-5 flex flex-wrap justify-center gap-x-8 gap-y-3">
        {data.map((slice, index) => {
          const color = CHART_SEGMENT_COLORS[index % CHART_SEGMENT_COLORS.length];
          const percentage = total > 0 ? ((slice.value / total) * 100).toFixed(1) : "0.0";

          return (
            <div key={slice.name} className="flex items-center gap-2.5 text-xs font-medium">
              <span
                className="h-3 w-3 shrink-0 rounded-full ring-1 ring-slate-600/50"
                style={{ backgroundColor: color }}
              />
              <span className="text-slate-200">
                {slice.name}: {formatCurrency(slice.value)}
                <span className="text-slate-400"> ({percentage}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
