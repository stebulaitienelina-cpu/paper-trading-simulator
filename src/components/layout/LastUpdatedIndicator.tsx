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
    <div className="mt-2 flex items-center gap-2 text-xs font-normal text-slate-500">
      <RefreshCw
        className={`h-3.5 w-3.5 ${isRefreshingQuotes ? "animate-spin text-emerald-400" : ""}`}
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
