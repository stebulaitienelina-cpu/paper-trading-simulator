import { STARTING_BALANCE } from "@/lib/mockData";
import type { Transaction } from "@/lib/types";

export interface AchievementDefinition {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

export interface Achievement extends AchievementDefinition {
  unlocked: boolean;
}

export interface ComputeAchievementsInput {
  transactions: Transaction[];
  portfolioValue: number;
  startingBalance?: number;
  positionSymbols: string[];
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: "profitable-trade",
    emoji: "💰",
    title: "Profitable Trade",
    description: "Lock in a profit by selling a stock for more than its purchase price.",
  },
  {
    id: "bull-market",
    emoji: "📈",
    title: "Bull Market",
    description: "Grow your portfolio above the starting balance.",
  },
  {
    id: "whale-trader",
    emoji: "🐋",
    title: "Whale Trader",
    description: "Execute a single large-scale transaction worth more than €2,000.",
  },
  {
    id: "diversified",
    emoji: "💼",
    title: "Diversified",
    description: "Hold shares in at least two different stocks.",
  },
];

const WHALE_TRADE_THRESHOLD_EUR = 2_000;

type HoldingsMap = Map<string, { shares: number; avgCost: number }>;

function sortTransactions(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    const byDate = a.simulatedDate.localeCompare(b.simulatedDate);
    if (byDate !== 0) {
      return byDate;
    }
    return a.createdAt - b.createdAt;
  });
}

export function hasProfitableSell(transactions: Transaction[]): boolean {
  const holdings: HoldingsMap = new Map();

  for (const tx of sortTransactions(transactions)) {
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

    if (realized > 0) {
      return true;
    }

    if (existing) {
      const remaining = Number((existing.shares - tx.shares).toFixed(6));
      if (remaining <= 0.0001) {
        holdings.delete(tx.symbol);
      } else {
        holdings.set(tx.symbol, { ...existing, shares: remaining });
      }
    }
  }

  return false;
}

export function computeAchievements({
  transactions,
  portfolioValue,
  startingBalance = STARTING_BALANCE,
  positionSymbols,
}: ComputeAchievementsInput): Achievement[] {
  const uniqueSymbols = new Set(
    positionSymbols.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean),
  );

  const unlocked = {
    "profitable-trade": hasProfitableSell(transactions),
    "bull-market": portfolioValue > startingBalance,
    "whale-trader": transactions.some(
      (transaction) => transaction.shares * transaction.price > WHALE_TRADE_THRESHOLD_EUR,
    ),
    "diversified": uniqueSymbols.size >= 2,
  };

  return ACHIEVEMENT_DEFINITIONS.map((definition) => ({
    ...definition,
    unlocked: unlocked[definition.id as keyof typeof unlocked] ?? false,
  }));
}

export function countUnlockedAchievements(achievements: Achievement[]): number {
  return achievements.filter((achievement) => achievement.unlocked).length;
}
