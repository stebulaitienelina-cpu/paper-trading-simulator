"use client";

import type { ReactElement } from "react";
import { ResponsiveContainer } from "recharts";

export const CHART_HEIGHT = 300;

interface ChartContainerProps {
  children: ReactElement;
}

export function ChartContainer({ children }: ChartContainerProps) {
  return (
    <div
      className="mt-4 w-full min-h-[300px] shrink-0"
      style={{ height: CHART_HEIGHT, minHeight: CHART_HEIGHT }}
    >
      <ResponsiveContainer width="100%" height={CHART_HEIGHT} debounce={50}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}
