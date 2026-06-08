"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react";
import { useTrading } from "@/context/TradingContext";
import { FALLBACK_MOCK_PRICE_EUR } from "@/lib/market/constants";
import { EXAMPLE_SYMBOLS } from "@/lib/mockData";
import type { AmountMode, LiveStockQuote, TradeType } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

export function TradeForm() {
  const { executeTrade, simulationMode, simulatedDate, fetchQuoteForSymbol } =
    useTrading();

  const [symbol, setSymbol] = useState("");
  const [tradeType, setTradeType] = useState<TradeType>("BUY");
  const [amountMode, setAmountMode] = useState<AmountMode>("eur");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [quote, setQuote] = useState<LiveStockQuote | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const normalizedSymbol = symbol.trim().toUpperCase();

  useEffect(() => {
    if (!normalizedSymbol) {
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setIsFetchingPrice(true);
        setPriceError(null);

        const result = await fetchQuoteForSymbol(normalizedSymbol);

        if (cancelled) {
          return;
        }

        if (result) {
          setQuote(result);
          setPriceError(null);
        } else {
          setQuote(null);
          setPriceError("Could not fetch a price for this symbol.");
        }

        setIsFetchingPrice(false);
      })();
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [normalizedSymbol, simulationMode, simulatedDate, fetchQuoteForSymbol]);

  const displayQuote =
    normalizedSymbol && quote?.symbol === normalizedSymbol ? quote : null;
  const displayPriceError = normalizedSymbol ? priceError : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const parsedAmount = parseFloat(amount);

    const result = await executeTrade({
      symbol: normalizedSymbol,
      type: tradeType,
      amountMode,
      amount: parsedAmount,
    });

    if (result.success) {
      const priceNote =
        displayQuote?.source === "fallback"
          ? ` (fallback test price ${formatCurrency(FALLBACK_MOCK_PRICE_EUR)})`
          : "";
      setFeedback({
        type: "success",
        message: `${tradeType} order executed successfully${priceNote}.`,
      });
      setAmount("");
    } else {
      setFeedback({
        type: "error",
        message: result.error ?? "Trade failed.",
      });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="mx-auto max-w-lg">
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/50"
      >
        <div>
          <label
            htmlFor="symbol"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Stock Symbol
          </label>
          <input
            id="symbol"
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="e.g. AAPL"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm uppercase placeholder:normal-case dark:border-zinc-700 dark:bg-zinc-900"
          />
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            Examples: {EXAMPLE_SYMBOLS.join(", ")}
          </p>
          {isFetchingPrice && normalizedSymbol && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Fetching price…
            </p>
          )}
          {!isFetchingPrice && displayQuote && displayQuote.source !== "fallback" && (
            <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {displayQuote.source === "historical" ? "Historical" : "Live"} price:{" "}
              {formatCurrency(displayQuote.price)}
              {amountMode === "eur" && amount && Number(amount) > 0 && (
                <>
                  {" "}
                  · ≈{" "}
                  {(Number(amount) / displayQuote.price)
                    .toFixed(4)
                    .replace(/\.?0+$/, "") || "0"}{" "}
                  shares for {formatCurrency(Number(amount))}
                </>
              )}
            </p>
          )}
          {!isFetchingPrice && displayQuote?.source === "fallback" && (
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Alpha Vantage rate limit reached. Using fallback test price of{" "}
                {formatCurrency(FALLBACK_MOCK_PRICE_EUR)} so you can still test BUY/SELL
                and database updates.
              </p>
            </div>
          )}
          {displayPriceError && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {displayPriceError}
            </p>
          )}
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Order Type
          </span>
          <div className="grid grid-cols-2 gap-2">
            {(["BUY", "SELL"] as TradeType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTradeType(type)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                  tradeType === type
                    ? type === "BUY"
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-red-600 bg-red-600 text-white"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400",
                )}
              >
                {type === "BUY" ? (
                  <ArrowUpCircle className="h-4 w-4" />
                ) : (
                  <ArrowDownCircle className="h-4 w-4" />
                )}
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Amount In
          </span>
          <div className="mb-2 flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-900">
            {(
              [
                { id: "eur" as AmountMode, label: "EUR" },
                { id: "shares" as AmountMode, label: "Shares" },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setAmountMode(id)}
                className={cn(
                  "flex-1 rounded-md py-1.5 text-xs font-medium transition-colors",
                  amountMode === id
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-500 dark:text-zinc-400",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            type="number"
            min="0"
            step={amountMode === "shares" ? "0.0001" : "0.01"}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={amountMode === "eur" ? "Amount in EUR" : "Number of shares"}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {simulationMode === "simulated"
            ? `Trade will use the closing price on ${simulatedDate}.`
            : "Trade will use the current live price (cached for 30 min to save API calls)."}
        </p>

        <button
          type="submit"
          disabled={isSubmitting || isFetchingPrice}
          className={cn(
            "w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60",
            tradeType === "BUY"
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-red-600 hover:bg-red-700",
          )}
        >
          {isSubmitting ? "Executing…" : `Execute ${tradeType} Order`}
        </button>

        {feedback && (
          <p
            className={cn(
              "rounded-lg px-3 py-2 text-sm",
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
            )}
          >
            {feedback.message}
          </p>
        )}
      </form>
    </div>
  );
}
