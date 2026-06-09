"use client";

import { useMemo } from "react";
import { useTrading } from "@/context/TradingContext";
import {
  buildAllocationData,
  buildDailyPnL,
  buildEquityCurve,
  ensureDailyPnLDisplay,
  ensureEquityCurveDisplay,
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

  const currentEquity = portfolio.cashBalance + stockValue;

  const rawEquityData = useMemo(
    () => buildEquityCurve(portfolio.transactions, portfolio.cashBalance, stockValue),
    [portfolio.transactions, portfolio.cashBalance, stockValue],
  );

  const equityData = useMemo(
    () => ensureEquityCurveDisplay(rawEquityData, currentEquity),
    [rawEquityData, currentEquity],
  );

  const isMockEquity = rawEquityData.length < 4;

  const allocationData = useMemo(
    () => buildAllocationData(portfolio.cashBalance, stockValue),
    [portfolio.cashBalance, stockValue],
  );

  const rawDailyPnL = useMemo(
    () => buildDailyPnL(portfolio.transactions),
    [portfolio.transactions],
  );

  const dailyPnLData = useMemo(
    () => ensureDailyPnLDisplay(rawDailyPnL),
    [rawDailyPnL],
  );

  const isMockDailyPnL = rawDailyPnL.length === 0;

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <EquityCurveChart data={equityData} isMockData={isMockEquity} />
      <AllocationChart data={allocationData} />
      <DailyPnLChart data={dailyPnLData} isMockData={isMockDailyPnL} />
    </div>
  );
}
