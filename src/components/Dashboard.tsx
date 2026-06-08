"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useTrading } from "@/context/TradingContext";
import { Navigation } from "@/components/layout/Navigation";
import { HistoryView } from "@/components/history/HistoryView";
import { PortfolioView } from "@/components/portfolio/PortfolioView";
import { TradeView } from "@/components/trade/TradeView";
import { WatchlistView } from "@/components/watchlist/WatchlistView";

export function Dashboard() {
  const { activeTab, isLoading, error, refreshPortfolio } = useTrading();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Navigation />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-zinc-500 dark:text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Loading portfolio from Supabase…</p>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-lg rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
              <div>
                <h2 className="font-semibold text-red-800 dark:text-red-300">
                  Failed to load portfolio
                </h2>
                <p className="mt-1 text-sm text-red-700 dark:text-red-400">{error}</p>
                <button
                  type="button"
                  onClick={() => void refreshPortfolio()}
                  className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {activeTab === "portfolio" && <PortfolioView />}
            {activeTab === "trade" && <TradeView />}
            {activeTab === "watchlist" && <WatchlistView />}
            {activeTab === "history" && <HistoryView />}
          </>
        )}
      </main>
    </div>
  );
}
