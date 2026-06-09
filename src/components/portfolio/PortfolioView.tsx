"use client";

import { useMemo } from "react";
import { useTrading } from "@/context/TradingContext";
import { PortfolioCharts } from "@/components/charts/PortfolioCharts";
import { AchievementsList } from "@/components/achievements/AchievementsList";
import { alertWarning, pageStack, sectionTitle } from "@/lib/ui/classes";
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
    <div className={pageStack}>
      <PortfolioSummary cashBalance={portfolio.cashBalance} stockValue={stockValue} />

      {quotesWarning && <p className={alertWarning}>{quotesWarning}</p>}

      {quotesError && <p className={alertWarning}>{quotesError}</p>}

      <PortfolioCharts />

      <AchievementsList />

      <section>
        <h2 className={sectionTitle}>Current Positions</h2>
        <div className="mt-5">
          <PositionsTable positions={portfolio.positions} />
        </div>
      </section>
    </div>
  );
}
