"use client";

import { useTrading } from "@/context/TradingContext";
import type { Position } from "@/lib/types";
import { emptyState, tableHead, tableRow, tableShell } from "@/lib/ui/classes";
import { cn, formatCurrency, formatPercent, formatShares } from "@/lib/utils";

interface PositionsTableProps {
  positions: Position[];
}

export function PositionsTable({ positions }: PositionsTableProps) {
  const { quotes } = useTrading();

  if (positions.length === 0) {
    return (
      <div className={emptyState}>
        <p className="text-sm font-normal text-slate-400">
          No open positions. Head to the Trade tab to buy your first stock.
        </p>
      </div>
    );
  }

  return (
    <div className={tableShell}>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className={tableHead}>
            <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              Symbol
            </th>
            <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              Shares Owned
            </th>
            <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              Current Price
            </th>
            <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              Total Value
            </th>
            <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              P/L (EUR)
            </th>
            <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              P/L (%)
            </th>
          </tr>
        </thead>
        <tbody>
          {positions.map((position) => {
            const quote = quotes[position.symbol];
            const currentPrice = quote?.price ?? 0;
            const totalValue = position.shares * currentPrice;
            const costBasis = position.shares * position.avgCost;
            const plEur = totalValue - costBasis;
            const plPercent = costBasis > 0 ? (plEur / costBasis) * 100 : 0;
            const isPositive = plEur >= 0;

            return (
              <tr key={position.symbol} className={tableRow}>
                <td className="px-5 py-4 font-medium text-slate-100">
                  {position.symbol}
                </td>
                <td className="px-5 py-4 font-normal tabular-nums text-slate-300">
                  {formatShares(position.shares)}
                </td>
                <td className="px-5 py-4 font-normal tabular-nums text-slate-300">
                  {quote ? formatCurrency(currentPrice) : "—"}
                </td>
                <td className="px-5 py-4 font-medium tabular-nums text-slate-100">
                  {quote ? formatCurrency(totalValue) : "—"}
                </td>
                <td
                  className={cn(
                    "px-5 py-4 font-medium tabular-nums",
                    quote
                      ? isPositive
                        ? "text-emerald-400"
                        : "text-red-400"
                      : "text-slate-500",
                  )}
                >
                  {quote ? (
                    <>
                      {isPositive ? "+" : ""}
                      {formatCurrency(plEur)}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td
                  className={cn(
                    "px-5 py-4 font-medium tabular-nums",
                    quote
                      ? isPositive
                        ? "text-emerald-400"
                        : "text-red-400"
                      : "text-slate-500",
                  )}
                >
                  {quote ? formatPercent(plPercent) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
