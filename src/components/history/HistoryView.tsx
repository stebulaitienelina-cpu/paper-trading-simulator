"use client";

import { TransactionsTable } from "./TransactionsTable";

export function HistoryView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Transaction History
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          All simulated trades with the date they were recorded under.
        </p>
      </div>
      <TransactionsTable />
    </div>
  );
}
