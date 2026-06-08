"use client";

import { TradeForm } from "./TradeForm";

export function TradeView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Place a Trade
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Buy or sell stocks using mock prices. All trades update your local
          portfolio instantly.
        </p>
      </div>
      <TradeForm />
    </div>
  );
}
