"use client";

import { Banknote, TrendingUp, Wallet } from "lucide-react";
import { btnTransition, card, cardPadding } from "@/lib/ui/classes";
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
      accent: "text-blue-400",
      bg: "bg-blue-950/40",
    },
    {
      label: "Cash Available",
      value: formatCurrency(cashBalance),
      icon: Banknote,
      accent: "text-emerald-400",
      bg: "bg-emerald-950/40",
    },
    {
      label: "Total Stock Value",
      value: formatCurrency(stockValue),
      icon: TrendingUp,
      accent: "text-violet-400",
      bg: "bg-violet-950/40",
    },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {cards.map(({ label, value, icon: Icon, accent, bg }) => (
        <div
          key={label}
          className={`${card} ${cardPadding} hover:shadow-md hover:shadow-slate-950/30 ${btnTransition}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {label}
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums text-slate-100">
                {value}
              </p>
            </div>
            <div className={`rounded-xl p-3 ${bg}`}>
              <Icon className={`h-5 w-5 ${accent}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
