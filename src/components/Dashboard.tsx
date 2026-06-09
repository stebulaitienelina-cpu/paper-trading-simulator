"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useTrading } from "@/context/TradingContext";
import { Navigation } from "@/components/layout/Navigation";
import { HistoryView } from "@/components/history/HistoryView";
import { PortfolioView } from "@/components/portfolio/PortfolioView";
import { TradeView } from "@/components/trade/TradeView";
import { WatchlistView } from "@/components/watchlist/WatchlistView";
import { btnTransition, card, cardPadding, pageBg } from "@/lib/ui/classes";

export function Dashboard() {
  const { activeTab, isLoading, error, refreshPortfolio } = useTrading();

  return (
    <div className={`flex min-h-screen flex-col ${pageBg}`}>
      <Navigation />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-28 text-slate-400">
            <Loader2 className="h-9 w-9 animate-spin text-emerald-400" />
            <p className="text-sm font-medium text-slate-300">
              Loading portfolio from Supabase…
            </p>
          </div>
        ) : error ? (
          <div className={`mx-auto max-w-lg ${card} ${cardPadding}`}>
            <div className="flex items-start gap-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
              <div>
                <h2 className="font-semibold tracking-tight text-red-300">
                  Failed to load portfolio
                </h2>
                <p className="mt-2 text-sm font-normal text-red-400">{error}</p>
                <button
                  type="button"
                  onClick={() => void refreshPortfolio()}
                  className={`mt-5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-500 ${btnTransition}`}
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
