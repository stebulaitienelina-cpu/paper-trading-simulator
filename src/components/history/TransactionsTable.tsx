"use client";

import { useTrading } from "@/context/TradingContext";
import { emptyState, pillBadge, tableHead, tableRow, tableShell } from "@/lib/ui/classes";
import { cn, formatCurrency, formatDate, formatShares } from "@/lib/utils";

export function TransactionsTable() {
  const { portfolio } = useTrading();
  const { transactions } = portfolio;

  if (transactions.length === 0) {
    return (
      <div className={emptyState}>
        <p className="text-sm font-normal text-slate-400">
          No transactions yet. Execute a trade to see your history here.
        </p>
      </div>
    );
  }

  return (
    <div className={tableShell}>
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className={tableHead}>
            <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              Simulated Date
            </th>
            <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              Type
            </th>
            <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              Symbol
            </th>
            <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              Shares
            </th>
            <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              Price
            </th>
            <th className="px-5 py-3.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className={tableRow}>
              <td className="px-5 py-4 font-medium text-emerald-400">
                {formatDate(tx.simulatedDate)}
              </td>
              <td className="px-5 py-4">
                <span
                  className={cn(
                    pillBadge,
                    tx.type === "BUY"
                      ? "bg-emerald-950/50 text-emerald-400"
                      : "bg-red-950/50 text-red-400",
                  )}
                >
                  {tx.type}
                </span>
              </td>
              <td className="px-5 py-4 font-medium text-slate-100">{tx.symbol}</td>
              <td className="px-5 py-4 font-normal tabular-nums text-slate-300">
                {formatShares(tx.shares)}
              </td>
              <td className="px-5 py-4 font-normal tabular-nums text-slate-300">
                {formatCurrency(tx.price)}
              </td>
              <td className="px-5 py-4 font-medium tabular-nums text-slate-100">
                {formatCurrency(tx.totalAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
