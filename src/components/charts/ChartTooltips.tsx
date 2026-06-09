"use client";

import { formatCurrency } from "@/lib/utils";

export const CHART_TOOLTIP_CLASS =
  "rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 shadow-lg shadow-black/40";

interface PremiumChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string }>;
  label?: string;
  valueLabel: string;
  valueColor?: string;
  formatValue?: (value: number) => string;
}

export function PremiumChartTooltip({
  active,
  payload,
  label,
  valueLabel,
  valueColor = "#f1f5f9",
  formatValue = formatCurrency,
}: PremiumChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const value = Number(payload[0].value);

  return (
    <div className={CHART_TOOLTIP_CLASS} style={{ fontSize: 12 }}>
      {label ? <p className="mb-1 font-medium text-slate-400">{label}</p> : null}
      <p className="font-semibold" style={{ color: valueColor }}>
        {valueLabel}: {formatValue(value)}
      </p>
    </div>
  );
}

interface AllocationTooltipProps {
  active?: boolean;
  payload?: unknown;
  total?: number;
}

export function AllocationTooltip({ active, payload, total = 0 }: AllocationTooltipProps) {
  const entries = payload as
    | ReadonlyArray<{
        value?: number | string;
        name?: string | number;
        payload?: { color?: string; fill?: string; name?: string };
      }>
    | undefined;

  if (!active || !entries?.length) {
    return null;
  }

  const entry = entries[0];
  const name = String(entry.name ?? entry.payload?.name ?? "Allocation");
  const value = Number(entry.value);
  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
  const slicePayload = entry.payload as { color?: string; fill?: string } | undefined;
  const accent = slicePayload?.fill ?? slicePayload?.color ?? "#6366f1";

  return (
    <div className={CHART_TOOLTIP_CLASS} style={{ fontSize: 12 }}>
      <p className="font-semibold" style={{ color: accent }}>
        {name}: {percentage}%
      </p>
      <p className="mt-1 text-slate-400">{formatCurrency(value)}</p>
    </div>
  );
}

export function formatDailyPnLLabel(value: number): string {
  const abs = formatCurrency(Math.abs(value));
  if (value > 0) {
    return `+${abs}`;
  }
  if (value < 0) {
    return `-${abs}`;
  }
  return abs;
}

interface DailyPnLTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
}

export function DailyPnLTooltip({ active, payload, label }: DailyPnLTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const pnl = Number(payload[0].value);
  const valueColor = pnl > 0 ? "#10b981" : pnl < 0 ? "#f43f5e" : "#f1f5f9";

  return (
    <div className={CHART_TOOLTIP_CLASS} style={{ fontSize: 12 }}>
      <p className="mb-1 font-medium text-slate-400">{label}</p>
      <p className="font-semibold" style={{ color: valueColor }}>
        Daily P&L: {formatDailyPnLLabel(pnl)}
      </p>
    </div>
  );
}

export function formatCompactEuroAxis(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `€${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  }
  return `€${value.toLocaleString("en-EU", { maximumFractionDigits: 0 })}`;
}

export function formatSignedEuroAxis(value: number): string {
  if (value === 0) {
    return "€0";
  }
  const sign = value > 0 ? "+" : "-";
  return `${sign}€${Math.abs(value).toLocaleString("en-EU", { maximumFractionDigits: 0 })}`;
}
