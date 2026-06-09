"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { QUOTE_REFRESH_INTERVAL_MS } from "@/lib/market/constants";
import {
  CLIENT_HISTORICAL_QUOTE_FETCH_TIMEOUT_MS,
  CLIENT_QUOTE_FETCH_TIMEOUT_MS,
  createClientFallbackQuote,
} from "@/lib/market/clientQuoteFallback";
import { isQuoteValidForSimulation, usesLivePricing } from "@/lib/market/resolveSimulationDate";
import type {
  AmountMode,
  LiveStockQuote,
  PortfolioState,
  SimulationMode,
  TabId,
  TradeType,
} from "@/lib/types";
import { todayISO } from "@/lib/utils";

interface ExecuteTradeInput {
  symbol: string;
  type: TradeType;
  amountMode: AmountMode;
  amount: number;
}

interface TradingContextValue {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  simulationMode: SimulationMode;
  setSimulationMode: (mode: SimulationMode) => void;
  simulatedDate: string;
  setSimulatedDate: (date: string) => void;
  portfolio: PortfolioState;
  quotes: Record<string, LiveStockQuote>;
  lastUpdated: number | null;
  quotesWarning: string | null;
  isLoading: boolean;
  isRefreshingQuotes: boolean;
  error: string | null;
  quotesError: string | null;
  refreshPortfolio: () => Promise<void>;
  refreshQuotes: (symbols?: string[], force?: boolean) => Promise<void>;
  fetchQuoteForSymbol: (
    symbol: string,
    options?: { force?: boolean },
  ) => Promise<LiveStockQuote>;
  executeTrade: (
    input: ExecuteTradeInput,
  ) => Promise<{ success: boolean; error?: string }>;
}

const EMPTY_PORTFOLIO: PortfolioState = {
  cashBalance: 0,
  positions: [],
  transactions: [],
};

const TradingContext = createContext<TradingContextValue | null>(null);

export function TradingProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabId>("portfolio");
  const [simulationMode, setSimulationMode] = useState<SimulationMode>("present");
  const [simulatedDate, setSimulatedDate] = useState(todayISO());
  const [portfolio, setPortfolio] = useState<PortfolioState>(EMPTY_PORTFOLIO);
  const [quotes, setQuotes] = useState<Record<string, LiveStockQuote>>({});
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [quotesWarning, setQuotesWarning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingQuotes, setIsRefreshingQuotes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotesError, setQuotesError] = useState<string | null>(null);

  const quotesRef = useRef(quotes);
  const lastUpdatedRef = useRef(lastUpdated);
  const simulationModeRef = useRef(simulationMode);
  const simulatedDateRef = useRef(simulatedDate);
  const refreshQuotesRef = useRef<
    (symbols?: string[], force?: boolean) => Promise<void>
  >(async () => {});

  useLayoutEffect(() => {
    quotesRef.current = quotes;
    lastUpdatedRef.current = lastUpdated;
    simulationModeRef.current = simulationMode;
    simulatedDateRef.current = simulatedDate;
  });

  const lastQuoteFetchContextRef = useRef<string | null>(null);
  const quoteFetchInFlightRef = useRef(false);

  const positionSymbols = useMemo(
    () => [...new Set(portfolio.positions.map((position) => position.symbol))],
    [portfolio.positions],
  );

  const mergeQuotes = useCallback((incoming: LiveStockQuote[]) => {
    setQuotes((prev) => {
      const next = { ...prev };
      for (const quote of incoming) {
        next[quote.symbol] = quote;
      }
      return next;
    });
  }, []);

  const fetchQuotesFromApi = useCallback(
    async (symbolList: string[]): Promise<LiveStockQuote[]> => {
      const mode = simulationModeRef.current;
      const date = simulatedDateRef.current;
      const fetchTimeoutMs = usesLivePricing(mode, date)
        ? CLIENT_QUOTE_FETCH_TIMEOUT_MS
        : CLIENT_HISTORICAL_QUOTE_FETCH_TIMEOUT_MS;

      const params = new URLSearchParams({
        symbols: symbolList.join(","),
        simulationMode: mode,
        simulatedDate: date,
      });

      const controller = new AbortController();
      const timeoutId = window.setTimeout(
        () => controller.abort(),
        fetchTimeoutMs,
      );

      try {
        const response = await fetch(`/api/quotes?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok || !Array.isArray(data.quotes)) {
          throw new Error(data.error ?? "Failed to fetch stock quotes.");
        }

        const incoming = data.quotes as LiveStockQuote[];
        mergeQuotes(incoming);
        setLastUpdated(data.lastUpdated ?? Date.now());
        setQuotesWarning(data.warning ?? null);

        return incoming;
      } catch (err) {
        if (!usesLivePricing(mode, date)) {
          const message =
            err instanceof Error
              ? err.message
              : "Historical price unavailable. Polygon may be rate-limited — try again in a moment.";
          setQuotesError(message);
          throw err instanceof Error ? err : new Error(message);
        }

        const fallbacks = symbolList.map((symbol) =>
          createClientFallbackQuote(symbol, mode, date),
        );
        mergeQuotes(fallbacks);
        setLastUpdated(Date.now());
        setQuotesWarning("Live API unavailable. Showing simulated prices.");
        return fallbacks;
      } finally {
        window.clearTimeout(timeoutId);
      }
    },
    [mergeQuotes],
  );

  const refreshPortfolio = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/portfolio");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load portfolio.");
      }

      setPortfolio({
        cashBalance: data.cashBalance,
        positions: data.positions,
        transactions: data.transactions,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load portfolio.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshQuotes = useCallback(
    async (symbols?: string[], force = false) => {
      const mode = simulationModeRef.current;
      const date = simulatedDateRef.current;
      const symbolList = symbols ?? positionSymbols;

      if (symbolList.length === 0) {
        setQuotes({});
        setLastUpdated(null);
        setQuotesError(null);
        setQuotesWarning(null);
        return;
      }

      const latestUpdated = lastUpdatedRef.current;
      if (
        !force &&
        !symbols &&
        latestUpdated &&
        Date.now() - latestUpdated < QUOTE_REFRESH_INTERVAL_MS
      ) {
        return;
      }

      const currentQuotes = quotesRef.current;
      const symbolsToFetch = force
        ? symbolList
        : symbolList.filter((symbol) => {
            const cached = currentQuotes[symbol];
            return !cached || !isQuoteValidForSimulation(cached, mode, date);
          });

      if (symbolsToFetch.length === 0) {
        return;
      }

      if (quoteFetchInFlightRef.current) {
        return;
      }

      quoteFetchInFlightRef.current = true;
      setIsRefreshingQuotes(true);
      setQuotesError(null);

      try {
        await fetchQuotesFromApi(symbolsToFetch);
      } catch (err) {
        setQuotesError(
          err instanceof Error ? err.message : "Failed to fetch stock quotes.",
        );
      } finally {
        quoteFetchInFlightRef.current = false;
        setIsRefreshingQuotes(false);
      }
    },
    [fetchQuotesFromApi, positionSymbols],
  );

  const fetchQuoteForSymbol = useCallback(
    async (
      symbol: string,
      options: { force?: boolean } = {},
    ): Promise<LiveStockQuote> => {
      const normalized = symbol.trim().toUpperCase();
      const mode = simulationModeRef.current;
      const date = simulatedDateRef.current;
      const cached = quotesRef.current[normalized];

      if (
        !options.force &&
        cached &&
        isQuoteValidForSimulation(cached, mode, date)
      ) {
        return cached;
      }

      try {
        const incoming = await fetchQuotesFromApi([normalized]);
        return (
          incoming[0] ?? createClientFallbackQuote(normalized, mode, date)
        );
      } catch (err) {
        if (!usesLivePricing(mode, date)) {
          throw err instanceof Error
            ? err
            : new Error("Historical price unavailable.");
        }
        return createClientFallbackQuote(normalized, mode, date);
      }
    },
    [fetchQuotesFromApi],
  );

  useLayoutEffect(() => {
    refreshQuotesRef.current = refreshQuotes;
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshPortfolio();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshPortfolio]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const fetchKey = `${simulationMode}:${simulatedDate}:${positionSymbols.join(",")}`;
    if (lastQuoteFetchContextRef.current === fetchKey) {
      return;
    }

    lastQuoteFetchContextRef.current = fetchKey;

    const timer = window.setTimeout(() => {
      void refreshQuotesRef.current(undefined, true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [simulationMode, simulatedDate, isLoading, positionSymbols]);

  useEffect(() => {
    if (simulationMode !== "present" || isLoading) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshQuotesRef.current(undefined, false);
    }, QUOTE_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [simulationMode, isLoading]);

  const executeTrade = useCallback(
    async (input: ExecuteTradeInput): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await fetch("/api/trades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...input,
            simulationMode,
            simulatedDate,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: data.error ?? "Trade failed.",
          };
        }

        setPortfolio(data.portfolio);

        const symbol = input.symbol.trim().toUpperCase();
        const cached = quotesRef.current[symbol];
        if (
          !cached ||
          !isQuoteValidForSimulation(cached, simulationMode, simulatedDate)
        ) {
          const tradeSymbols = [
            ...new Set([
              ...data.portfolio.positions.map(
                (position: { symbol: string }) => position.symbol,
              ),
              symbol,
            ]),
          ];
          await refreshQuotesRef.current(tradeSymbols, false);
        }

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to execute trade.",
        };
      }
    },
    [simulationMode, simulatedDate],
  );

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      simulationMode,
      setSimulationMode,
      simulatedDate,
      setSimulatedDate,
      portfolio,
      quotes,
      lastUpdated,
      quotesWarning,
      isLoading,
      isRefreshingQuotes,
      error,
      quotesError,
      refreshPortfolio,
      refreshQuotes,
      fetchQuoteForSymbol,
      executeTrade,
    }),
    [
      activeTab,
      simulationMode,
      simulatedDate,
      portfolio,
      quotes,
      lastUpdated,
      quotesWarning,
      isLoading,
      isRefreshingQuotes,
      error,
      quotesError,
      refreshPortfolio,
      refreshQuotes,
      fetchQuoteForSymbol,
      executeTrade,
    ],
  );

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>;
}

export function useTrading() {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error("useTrading must be used within a TradingProvider");
  }
  return context;
}
