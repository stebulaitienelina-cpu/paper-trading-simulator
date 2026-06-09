"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react";
import { useTrading } from "@/context/TradingContext";
import { isQuoteMatchingContext } from "@/lib/market/resolveSimulationDate";
import { EXAMPLE_SYMBOLS } from "@/lib/mockData";
import type { AmountMode, LiveStockQuote, TradeType } from "@/lib/types";
import { alertWarning, btnTransition, card, cardPadding, inputField, toggleActive, toggleGroup, toggleInactive } from "@/lib/ui/classes";
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
  const fetchQuoteForSymbolRef = useRef(fetchQuoteForSymbol);

  useLayoutEffect(() => {
    fetchQuoteForSymbolRef.current = fetchQuoteForSymbol;
  });

  useEffect(() => {
    if (!normalizedSymbol) {
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setIsFetchingPrice(true);
        setPriceError(null);

        try {
          const result = await fetchQuoteForSymbolRef.current(normalizedSymbol, {
            force: true,
          });

          if (cancelled) {
            return;
          }

          setQuote(result);
          setPriceError(null);
        } catch (err) {
          if (!cancelled) {
            setQuote(null);
            setPriceError(
              err instanceof Error
                ? err.message
                : "Could not fetch a historical price for this symbol.",
            );
          }
        } finally {
          setIsFetchingPrice(false);
        }
      })();
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      setIsFetchingPrice(false);
    };
  }, [normalizedSymbol, simulationMode, simulatedDate]);

  const displayQuote =
    normalizedSymbol &&
    quote?.symbol === normalizedSymbol &&
    isQuoteMatchingContext(quote, simulationMode, simulatedDate)
      ? quote
      : null;
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
          ? ` (simulated price ${formatCurrency(displayQuote.price)})`
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
        className={`space-y-6 ${card} ${cardPadding}`}
      >
        <div>
          <label
            htmlFor="symbol"
            className="mb-1.5 block text-sm font-medium text-slate-300"
          >
            Stock Symbol
          </label>
          <input
            id="symbol"
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="e.g. AAPL"
            className={cn(inputField, "uppercase placeholder:normal-case")}
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Examples: {EXAMPLE_SYMBOLS.join(", ")}
          </p>
          {isFetchingPrice && normalizedSymbol && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
              Fetching price…
            </p>
          )}
          {!isFetchingPrice && displayQuote && displayQuote.source !== "fallback" && (
            <p className="mt-1 text-xs font-medium text-emerald-400">
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
            <div className={`mt-2 flex items-start gap-2 ${alertWarning} px-3.5 py-2.5 text-xs`}>
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                {simulationMode === "simulated" && simulatedDate
                  ? `Historical API unavailable for ${simulatedDate}.`
                  : "Live API unavailable."}{" "}
                Using simulated price of {formatCurrency(displayQuote.price)} so you
                can still test BUY/SELL and database updates.
              </p>
            </div>
          )}
          {displayPriceError && (
            <p className="mt-1 text-xs text-red-400">{displayPriceError}</p>
          )}
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-300">
            Order Type
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            {(["BUY", "SELL"] as TradeType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTradeType(type)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium",
                  btnTransition,
                  tradeType === type
                    ? type === "BUY"
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                      : "border-red-600 bg-red-600 text-white shadow-sm"
                    : "border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-slate-700/40 hover:text-slate-100",
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
          <span className="mb-1.5 block text-sm font-medium text-slate-300">
            Amount In
          </span>
          <div className={`mb-3 ${toggleGroup}`}>
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
                  "flex-1 rounded-lg py-2 text-xs font-medium",
                  btnTransition,
                  amountMode === id ? toggleActive : toggleInactive,
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
            className={inputField}
          />
        </div>

        <p className="text-xs font-normal leading-relaxed text-slate-500">
          {simulationMode === "simulated"
            ? `Trade will use the closing price on ${simulatedDate} (refreshes when the date changes).`
            : "Trade will use the current live price (cached for 30 min to save API calls)."}
        </p>

        <button
          type="submit"
          disabled={isSubmitting || isFetchingPrice}
          className={cn(
            "w-full rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60",
            btnTransition,
            tradeType === "BUY"
              ? "bg-emerald-600 shadow-sm hover:bg-emerald-500 hover:shadow-md"
              : "bg-red-600 shadow-sm hover:bg-red-500 hover:shadow-md",
          )}
        >
          {isSubmitting ? "Executing…" : `Execute ${tradeType} Order`}
        </button>

        {feedback && (
          <p
            className={cn(
              "rounded-xl border px-4 py-3 text-sm font-normal",
              feedback.type === "success"
                ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-400"
                : "border-red-900/50 bg-red-950/30 text-red-400",
            )}
          >
            {feedback.message}
          </p>
        )}
      </form>
    </div>
  );
}
