"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Star, StarOff } from "lucide-react";
import { useTrading } from "@/context/TradingContext";
import type { LiveStockQuote, WatchlistItem } from "@/lib/types";
import {
  alertError,
  alertSuccess,
  btnTransition,
  card,
  cardPadding,
  emptyState,
  inputField,
  pageStack,
  pillBadge,
  sectionSubtitle,
  sectionTitle,
} from "@/lib/ui/classes";
import { cn, formatCurrency } from "@/lib/utils";

export function WatchlistView() {
  const { simulationMode, simulatedDate } = useTrading();

  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [quotes, setQuotes] = useState<Record<string, LiveStockQuote>>({});
  const [symbolInput, setSymbolInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadPrices = useCallback(
    async (symbols: string[]) => {
      if (symbols.length === 0) {
        setQuotes({});
        return;
      }

      const params = new URLSearchParams({
        symbols: symbols.join(","),
        simulationMode,
        simulatedDate,
      });

      const response = await fetch(`/api/quotes?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to fetch prices.");
      }

      const nextQuotes: Record<string, LiveStockQuote> = {};
      for (const quote of data.quotes as LiveStockQuote[]) {
        nextQuotes[quote.symbol] = quote;
      }
      setQuotes(nextQuotes);
    },
    [simulationMode, simulatedDate],
  );

  const loadWatchlist = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/watchlist");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load watchlist.");
      }

      const nextItems = data.items as WatchlistItem[];
      setItems(nextItems);
      await loadPrices(nextItems.map((item) => item.stockSymbol));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load watchlist.");
    } finally {
      setIsLoading(false);
    }
  }, [loadPrices]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadWatchlist();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadWatchlist]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const symbol = symbolInput.trim().toUpperCase();
    if (!symbol) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    setError(null);

    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockSymbol: symbol }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to add symbol.");
      }

      setSymbolInput("");
      setFeedback(`${symbol} added to watchlist.`);
      await loadWatchlist();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add symbol.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (symbol: string) => {
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(
        `/api/watchlist?stockSymbol=${encodeURIComponent(symbol)}`,
        { method: "DELETE" },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to remove symbol.");
      }

      setFeedback(`${symbol} removed from watchlist.`);
      await loadWatchlist();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove symbol.");
    }
  };

  return (
    <div className={pageStack}>
      <div>
        <h2 className={sectionTitle}>Watchlist</h2>
        <p className={sectionSubtitle}>
          Track symbols and their current or fallback prices.
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className={`flex flex-col gap-4 sm:flex-row sm:items-end ${card} ${cardPadding}`}
      >
        <div className="flex-1">
          <label
            htmlFor="watchlist-symbol"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Add symbol
          </label>
          <input
            id="watchlist-symbol"
            type="text"
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
            placeholder="e.g. MSFT"
            className={cn(inputField, "uppercase placeholder:normal-case")}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !symbolInput.trim()}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60",
            btnTransition,
          )}
        >
          <Star className="h-4 w-4" />
          {isSubmitting ? "Adding…" : "Add to Watchlist"}
        </button>
      </form>

      {feedback && <p className={alertSuccess}>{feedback}</p>}

      {error && <p className={alertError}>{error}</p>}

      {isLoading ? (
        <div className="flex items-center justify-center gap-3 py-20 text-sm font-medium text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
          Loading watchlist…
        </div>
      ) : items.length === 0 ? (
        <div className={emptyState}>
          <p className="text-sm font-normal text-slate-400">
            Your watchlist is empty. Add a symbol above to get started.
          </p>
        </div>
      ) : (
        <div className={`overflow-hidden ${card}`}>
          <ul className="divide-y divide-slate-700">
            {items.map((item) => {
              const quote = quotes[item.stockSymbol];
              const isFallback = quote?.source === "fallback";

              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors duration-200 hover:bg-slate-700/40"
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <p className="font-medium tracking-tight text-slate-100">
                        {item.stockSymbol}
                      </p>
                      {quote && (
                        <span
                          className={cn(
                            pillBadge,
                            isFallback
                              ? "bg-amber-950/40 text-amber-400"
                              : "bg-slate-700 text-slate-400",
                          )}
                        >
                          {isFallback ? "Fallback" : quote.source}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-normal tabular-nums text-slate-400">
                      {quote ? formatCurrency(quote.price) : "Price unavailable"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleRemove(item.stockSymbol)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-400",
                      btnTransition,
                      "hover:border-red-900/60 hover:bg-red-950/30 hover:text-red-400",
                    )}
                    aria-label={`Remove ${item.stockSymbol} from watchlist`}
                  >
                    <StarOff className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
