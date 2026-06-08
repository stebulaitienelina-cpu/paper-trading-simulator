"use client";

import { useMemo } from "react";
import { useTrading } from "@/context/TradingContext";
import {
  buildAllocationData,
  buildDailyPnL,
  buildEquityCurve,
  sumPositionMarketValue,
} from "@/lib/charts/portfolioAnalytics";
import { AllocationChart } from "./AllocationChart";
import { DailyPnLChart } from "./DailyPnLChart";
import { EquityCurveChart } from "./EquityCurveChart";

export function PortfolioCharts() {
  const { portfolio, quotes } = useTrading();

  const stockValue = useMemo(
    () => sumPositionMarketValue(portfolio.positions, quotes),
    [portfolio.positions, quotes],
  );

  const equityData = useMemo(
    () => buildEquityCurve(portfolio.transactions, portfolio.cashBalance, stockValue),
    [portfolio.transactions, portfolio.cashBalance, stockValue],
  );

  const allocationData = useMemo(
    () => buildAllocationData(portfolio.cashBalance, stockValue),
    [portfolio.cashBalance, stockValue],
  );

  const dailyPnLData = useMemo(
    () => buildDailyPnL(portfolio.transactions),
    [portfolio.transactions],
  );

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <EquityCurveChart data={equityData} />
      <AllocationChart data={allocationData} />
      <DailyPnLChart data={dailyPnLData} />
    </div>
  );
}
