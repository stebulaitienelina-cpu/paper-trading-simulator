"use client";

import { useTrading } from "@/context/TradingContext";
import type { Position } from "@/lib/types";
import { cn, formatCurrency, formatPercent, formatShares } from "@/lib/utils";

interface PositionsTableProps {
  positions: Position[];
}

export function PositionsTable({ positions }: PositionsTableProps) {
  const { quotes } = useTrading();

  if (positions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-700">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No open positions. Head to the Trade tab to buy your first stock.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
            <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
              Symbol
            </th>
            <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
              Shares Owned
            </th>
            <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
              Current Price
            </th>
            <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
              Total Value
            </th>
            <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
              P/L (EUR)
            </th>
            <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
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
              <tr
                key={position.symbol}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/80"
              >
                <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                  {position.symbol}
                </td>
                <td className="px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                  {formatShares(position.shares)}
                </td>
                <td className="px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                  {quote ? formatCurrency(currentPrice) : "—"}
                </td>
                <td className="px-4 py-3 tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
                  {quote ? formatCurrency(totalValue) : "—"}
                </td>
                <td
                  className={cn(
                    "px-4 py-3 tabular-nums font-medium",
                    quote
                      ? isPositive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                      : "text-zinc-400",
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
                    "px-4 py-3 tabular-nums font-medium",
                    quote
                      ? isPositive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                      : "text-zinc-400",
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
