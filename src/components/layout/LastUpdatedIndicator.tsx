"use client";

import { RefreshCw } from "lucide-react";
import { useTrading } from "@/context/TradingContext";
import { QUOTE_REFRESH_INTERVAL_MS } from "@/lib/market/constants";
import { formatDateTime } from "@/lib/utils";

export function LastUpdatedIndicator() {
  const { lastUpdated, isRefreshingQuotes, simulationMode } = useTrading();

  if (!lastUpdated) {
    return null;
  }

  const refreshSeconds = QUOTE_REFRESH_INTERVAL_MS / 1000;

  return (
    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
      <RefreshCw
        className={`h-3.5 w-3.5 ${isRefreshingQuotes ? "animate-spin" : ""}`}
      />
      <span>
        Last updated: {formatDateTime(lastUpdated)}
        {simulationMode === "present"
          ? ` · refreshes every ${refreshSeconds}s (cached 30 min)`
          : " · historical prices (cached)"}
      </span>
    </div>
  );
}
