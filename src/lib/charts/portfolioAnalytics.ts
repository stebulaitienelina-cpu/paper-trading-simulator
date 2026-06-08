import type { Position, Transaction } from "@/lib/types";
import { todayISO } from "@/lib/utils";

export interface EquityPoint {
  date: string;
  label: string;
  equity: number;
}

export interface AllocationSlice {
  name: string;
  value: number;
  color: string;
}

export interface DailyPnLPoint {
  date: string;
  label: string;
  pnl: number;
}

type HoldingsMap = Map<string, { shares: number; avgCost: number }>;

function holdingsCostBasis(holdings: HoldingsMap): number {
  let total = 0;
  for (const { shares, avgCost } of holdings.values()) {
    total += shares * avgCost;
  }
  return Number(total.toFixed(2));
}

function applyTransaction(
  cash: number,
  holdings: HoldingsMap,
  tx: Transaction,
): number {
  if (tx.type === "BUY") {
    const existing = holdings.get(tx.symbol);
    const nextCash = cash - tx.totalAmount;

    if (existing) {
      const newShares = existing.shares + tx.shares;
      const newAvgCost =
        (existing.shares * existing.avgCost + tx.totalAmount) / newShares;
      holdings.set(tx.symbol, { shares: newShares, avgCost: newAvgCost });
    } else {
      holdings.set(tx.symbol, {
        shares: tx.shares,
        avgCost: tx.totalAmount / tx.shares,
      });
    }

    return nextCash;
  }

  const existing = holdings.get(tx.symbol);
  if (!existing) {
    return cash + tx.totalAmount;
  }

  const remaining = Number((existing.shares - tx.shares).toFixed(6));
  if (remaining <= 0.0001) {
    holdings.delete(tx.symbol);
  } else {
    holdings.set(tx.symbol, { ...existing, shares: remaining });
  }

  return cash + tx.totalAmount;
}

function sortTransactions(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    const byDate = a.simulatedDate.localeCompare(b.simulatedDate);
    if (byDate !== 0) {
      return byDate;
    }
    return a.createdAt - b.createdAt;
  });
}

function deriveStartingCash(
  currentCash: number,
  transactions: Transaction[],
): number {
  const netCashFlow = transactions.reduce((sum, tx) => {
    return tx.type === "BUY" ? sum - tx.totalAmount : sum + tx.totalAmount;
  }, 0);

  return Number((currentCash - netCashFlow).toFixed(2));
}

export function buildEquityCurve(
  transactions: Transaction[],
  currentCash: number,
  currentStockValue: number,
): EquityPoint[] {
  const sorted = sortTransactions(transactions);

  if (sorted.length === 0) {
    const today = todayISO();
    return [
      {
        date: today,
        label: today,
        equity: Number((currentCash + currentStockValue).toFixed(2)),
      },
    ];
  }

  let cash = deriveStartingCash(currentCash, sorted);
  const holdings: HoldingsMap = new Map();

  const points: EquityPoint[] = [
    {
      date: sorted[0].simulatedDate,
      label: sorted[0].simulatedDate,
      equity: Number((cash + holdingsCostBasis(holdings)).toFixed(2)),
    },
  ];

  for (const tx of sorted) {
    cash = applyTransaction(cash, holdings, tx);
    const equity = Number((cash + holdingsCostBasis(holdings)).toFixed(2));
    const lastPoint = points[points.length - 1];

    if (lastPoint.date === tx.simulatedDate) {
      lastPoint.equity = equity;
    } else {
      points.push({
        date: tx.simulatedDate,
        label: tx.simulatedDate,
        equity,
      });
    }
  }

  const today = todayISO();
  const liveEquity = Number((currentCash + currentStockValue).toFixed(2));
  const lastPoint = points[points.length - 1];

  if (lastPoint.date === today) {
    lastPoint.equity = liveEquity;
  } else {
    points.push({ date: today, label: "Today", equity: liveEquity });
  }

  return points;
}

export function buildAllocationData(
  cashBalance: number,
  stockValue: number,
): AllocationSlice[] {
  const slices: AllocationSlice[] = [];

  if (cashBalance > 0) {
    slices.push({
      name: "Cash",
      value: Number(cashBalance.toFixed(2)),
      color: "#059669",
    });
  }

  if (stockValue > 0) {
    slices.push({
      name: "Stocks",
      value: Number(stockValue.toFixed(2)),
      color: "#34d399",
    });
  }

  if (slices.length === 0) {
    slices.push({ name: "Cash", value: 0, color: "#059669" });
  }

  return slices;
}

export function buildDailyPnL(transactions: Transaction[]): DailyPnLPoint[] {
  const sorted = sortTransactions(transactions);
  const dailyTotals = new Map<string, number>();
  const holdings: HoldingsMap = new Map();

  for (const tx of sorted) {
    if (tx.type === "BUY") {
      const existing = holdings.get(tx.symbol);
      if (existing) {
        const newShares = existing.shares + tx.shares;
        const newAvgCost =
          (existing.shares * existing.avgCost + tx.totalAmount) / newShares;
        holdings.set(tx.symbol, { shares: newShares, avgCost: newAvgCost });
      } else {
        holdings.set(tx.symbol, {
          shares: tx.shares,
          avgCost: tx.totalAmount / tx.shares,
        });
      }
      continue;
    }

    const existing = holdings.get(tx.symbol);
    const avgCost = existing?.avgCost ?? tx.price;
    const realized = Number(((tx.price - avgCost) * tx.shares).toFixed(2));

    dailyTotals.set(
      tx.simulatedDate,
      Number(((dailyTotals.get(tx.simulatedDate) ?? 0) + realized).toFixed(2)),
    );

    if (existing) {
      const remaining = Number((existing.shares - tx.shares).toFixed(6));
      if (remaining <= 0.0001) {
        holdings.delete(tx.symbol);
      } else {
        holdings.set(tx.symbol, { ...existing, shares: remaining });
      }
    }
  }

  return [...dailyTotals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, pnl]) => ({
      date,
      label: date,
      pnl,
    }));
}

export function sumPositionMarketValue(
  positions: Position[],
  quotes: Record<string, { price: number }>,
): number {
  return Number(
    positions
      .reduce((sum, position) => {
        const price = quotes[position.symbol]?.price ?? 0;
        return sum + position.shares * price;
      }, 0)
      .toFixed(2),
  );
}
