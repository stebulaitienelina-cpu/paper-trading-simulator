"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Star, StarOff } from "lucide-react";
import { useTrading } from "@/context/TradingContext";
import type { LiveStockQuote, WatchlistItem } from "@/lib/types";
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
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Watchlist
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Track symbols and their current or fallback prices.
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-end dark:border-zinc-800 dark:bg-zinc-900/50"
      >
        <div className="flex-1">
          <label
            htmlFor="watchlist-symbol"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Add symbol
          </label>
          <input
            id="watchlist-symbol"
            type="text"
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
            placeholder="e.g. MSFT"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm uppercase placeholder:normal-case dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !symbolInput.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Star className="h-4 w-4" />
          {isSubmitting ? "Adding…" : "Add to Watchlist"}
        </button>
      </form>

      {feedback && (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
          {feedback}
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-500 dark:text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading watchlist…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Your watchlist is empty. Add a symbol above to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {items.map((item) => {
              const quote = quotes[item.stockSymbol];
              const isFallback = quote?.source === "fallback";

              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4 bg-white px-4 py-3 dark:bg-zinc-900/50"
                >
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.stockSymbol}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {quote ? (
                        <>
                          {formatCurrency(quote.price)}
                          {isFallback ? " · fallback price" : ` · ${quote.source}`}
                        </>
                      ) : (
                        "Price unavailable"
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleRemove(item.stockSymbol)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                      "border-zinc-200 text-zinc-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600",
                      "dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-red-900 dark:hover:bg-red-950/30 dark:hover:text-red-400",
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
