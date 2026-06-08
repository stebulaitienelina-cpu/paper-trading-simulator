"use client";

import { useTrading } from "@/context/TradingContext";
import { cn, formatCurrency, formatDate, formatShares } from "@/lib/utils";

export function TransactionsTable() {
  const { portfolio } = useTrading();
  const { transactions } = portfolio;

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-700">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No transactions yet. Execute a trade to see your history here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
            <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
              Simulated Date
            </th>
            <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
              Type
            </th>
            <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
              Symbol
            </th>
            <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
              Shares
            </th>
            <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
              Price
            </th>
            <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr
              key={tx.id}
              className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/80"
            >
              <td className="px-4 py-3 font-medium text-emerald-700 dark:text-emerald-400">
                {formatDate(tx.simulatedDate)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    tx.type === "BUY"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
                  )}
                >
                  {tx.type}
                </span>
              </td>
              <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                {tx.symbol}
              </td>
              <td className="px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                {formatShares(tx.shares)}
              </td>
              <td className="px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                {formatCurrency(tx.price)}
              </td>
              <td className="px-4 py-3 tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
                {formatCurrency(tx.totalAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
