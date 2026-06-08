"use client";

import { Banknote, TrendingUp, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PortfolioSummaryProps {
  cashBalance: number;
  stockValue: number;
}

export function PortfolioSummary({ cashBalance, stockValue }: PortfolioSummaryProps) {
  const totalBalance = cashBalance + stockValue;

  const cards = [
    {
      label: "Total Balance",
      value: formatCurrency(totalBalance),
      icon: Wallet,
      accent: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Cash Available",
      value: formatCurrency(cashBalance),
      icon: Banknote,
      accent: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      label: "Total Stock Value",
      value: formatCurrency(stockValue),
      icon: TrendingUp,
      accent: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-950/30",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map(({ label, value, icon: Icon, accent, bg }) => (
        <div
          key={label}
          className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/50"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {label}
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                {value}
              </p>
            </div>
            <div className={`rounded-lg p-2.5 ${bg}`}>
              <Icon className={`h-5 w-5 ${accent}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
