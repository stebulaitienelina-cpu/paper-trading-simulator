"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CLIENT_QUOTE_CACHE_TTL_MS,
  QUOTE_REFRESH_INTERVAL_MS,
} from "@/lib/market/constants";
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
  fetchQuoteForSymbol: (symbol: string) => Promise<LiveStockQuote | null>;
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

function isQuoteFresh(quote: LiveStockQuote): boolean {
  return Date.now() - quote.fetchedAt < CLIENT_QUOTE_CACHE_TTL_MS;
}

export function TradingProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabId>("portfolio");
  const [simulationMode, setSimulationMode] =
    useState<SimulationMode>("present");
  const [simulatedDate, setSimulatedDate] = useState(todayISO());
  const [portfolio, setPortfolio] = useState<PortfolioState>(EMPTY_PORTFOLIO);
  const [quotes, setQuotes] = useState<Record<string, LiveStockQuote>>({});
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [quotesWarning, setQuotesWarning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingQuotes, setIsRefreshingQuotes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotesError, setQuotesError] = useState<string | null>(null);

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
    async (symbolList: string[]) => {
      const params = new URLSearchParams({
        symbols: symbolList.join(","),
        simulationMode,
        simulatedDate,
      });

      const response = await fetch(`/api/quotes?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to fetch stock quotes.");
      }

      const incoming = data.quotes as LiveStockQuote[];
      mergeQuotes(incoming);
      setLastUpdated(data.lastUpdated ?? Date.now());
      setQuotesWarning(data.warning ?? null);

      return incoming;
    },
    [mergeQuotes, simulationMode, simulatedDate],
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
      setError(
        err instanceof Error ? err.message : "Failed to load portfolio.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshQuotes = useCallback(
    async (symbols?: string[], force = false) => {
      const symbolList =
        symbols ??
        [
          ...new Set(portfolio.positions.map((position) => position.symbol)),
        ];

      if (symbolList.length === 0) {
        setQuotes({});
        setLastUpdated(null);
        setQuotesError(null);
        setQuotesWarning(null);
        return;
      }

      if (
        !force &&
        !symbols &&
        lastUpdated &&
        Date.now() - lastUpdated < QUOTE_REFRESH_INTERVAL_MS
      ) {
        return;
      }

      const symbolsToFetch = force
        ? symbolList
        : symbolList.filter((symbol) => {
            const cached = quotes[symbol];
            return !cached || !isQuoteFresh(cached);
          });

      if (symbolsToFetch.length === 0) {
        return;
      }

      setIsRefreshingQuotes(true);
      setQuotesError(null);

      try {
        await fetchQuotesFromApi(symbolsToFetch);
      } catch (err) {
        setQuotesError(
          err instanceof Error ? err.message : "Failed to fetch stock quotes.",
        );
      } finally {
        setIsRefreshingQuotes(false);
      }
    },
    [
      portfolio.positions,
      lastUpdated,
      quotes,
      fetchQuotesFromApi,
    ],
  );

  const fetchQuoteForSymbol = useCallback(
    async (symbol: string): Promise<LiveStockQuote | null> => {
      const normalized = symbol.trim().toUpperCase();
      if (!normalized) {
        return null;
      }

      const cached = quotes[normalized];
      if (cached && isQuoteFresh(cached)) {
        return cached;
      }

      try {
        const incoming = await fetchQuotesFromApi([normalized]);
        return incoming[0] ?? null;
      } catch {
        return cached ?? null;
      }
    },
    [quotes, fetchQuotesFromApi],
  );

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

    const timer = window.setTimeout(() => {
      void refreshQuotes();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isLoading, refreshQuotes]);

  useEffect(() => {
    if (simulationMode !== "present" || isLoading) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshQuotes(undefined, false);
    }, QUOTE_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [simulationMode, isLoading, refreshQuotes]);

  const executeTrade = useCallback(
    async (
      input: ExecuteTradeInput,
    ): Promise<{ success: boolean; error?: string }> => {
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
        const cached = quotes[symbol];
        if (!cached || !isQuoteFresh(cached)) {
          await refreshQuotes(
            [
              ...new Set([
                ...data.portfolio.positions.map(
                  (position: { symbol: string }) => position.symbol,
                ),
                symbol,
              ]),
            ],
            false,
          );
        }

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error ? err.message : "Failed to execute trade.",
        };
      }
    },
    [simulationMode, simulatedDate, refreshQuotes, quotes],
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

  return (
    <TradingContext.Provider value={value}>{children}</TradingContext.Provider>
  );
}

export function useTrading() {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error("useTrading must be used within a TradingProvider");
  }
  return context;
}
