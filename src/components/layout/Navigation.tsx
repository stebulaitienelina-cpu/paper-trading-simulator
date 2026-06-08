"use client";

import { History, LayoutDashboard, Star, TrendingUp } from "lucide-react";
import { useTrading } from "@/context/TradingContext";
import type { TabId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LastUpdatedIndicator } from "./LastUpdatedIndicator";
import { TimeTravelMode } from "./TimeTravelMode";

const TABS: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "portfolio", label: "Portfolio", icon: LayoutDashboard },
  { id: "trade", label: "Trade", icon: TrendingUp },
  { id: "watchlist", label: "Watchlist", icon: Star },
  { id: "history", label: "History", icon: History },
];

export function Navigation() {
  const { activeTab, setActiveTab } = useTrading();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Paper Trading Simulator
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Live market data via Alpha Vantage
              </p>
              <LastUpdatedIndicator />
            </div>
            <TimeTravelMode />
          </div>

          <nav className="flex gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900/50">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors sm:flex-none sm:justify-start",
                  activeTab === id
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
