"use client";

import { useMemo } from "react";
import { useTrading } from "@/context/TradingContext";
import { PortfolioCharts } from "@/components/charts/PortfolioCharts";
import { PortfolioSummary } from "./PortfolioSummary";
import { PositionsTable } from "./PositionsTable";

export function PortfolioView() {
  const { portfolio, quotes, quotesError, quotesWarning } = useTrading();

  const stockValue = useMemo(
    () =>
      portfolio.positions.reduce((sum, position) => {
        const price = quotes[position.symbol]?.price ?? 0;
        return sum + position.shares * price;
      }, 0),
    [portfolio.positions, quotes],
  );

  return (
    <div className="space-y-6">
      <PortfolioSummary
        cashBalance={portfolio.cashBalance}
        stockValue={stockValue}
      />

      {quotesWarning && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          {quotesWarning}
        </p>
      )}

      {quotesError && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          {quotesError}
        </p>
      )}

      <PortfolioCharts />

      <section>
        <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Current Positions
        </h2>
        <PositionsTable positions={portfolio.positions} />
      </section>
    </div>
  );
}
