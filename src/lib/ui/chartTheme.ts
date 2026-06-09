export const chartTickFill = "#94a3b8";

export const chartGridStroke = "#334155";

export const chartReferenceStroke = "#64748b";

export const CHART_SEGMENT_COLORS = [
  "#10b981",
  "#6366f1",
  "#f59e0b",
  "#06b6d4",
  "#ec4899",
  "#8b5cf6",
] as const;

export function getChartSegmentColor(index: number): string {
  return CHART_SEGMENT_COLORS[index % CHART_SEGMENT_COLORS.length];
}
