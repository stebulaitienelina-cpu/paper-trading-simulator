import {
  DAILY_SERIES_CACHE_TTL_MS,
  LIVE_QUOTE_CACHE_TTL_MS,
  POLYGON_HISTORICAL_MAX_RETRIES,
  POLYGON_HISTORICAL_RETRY_DELAY_MS,
} from "./constants";
import { fetchFinnhubLiveQuote } from "./finnhub";
import {
  fetchPolygonHistoricalClose,
  getStalePolygonHistoricalClose,
  PolygonRateLimitError,
} from "./polygon";
import { resolveSimulationDate } from "./resolveSimulationDate";
import {
  generateSimulationPrice,
  withTimeout,
} from "./simulationFallback";
import type { SimulationMode } from "@/lib/types";
import { todayISO } from "@/lib/utils";

export type StockPriceSource = "live" | "historical" | "fallback";

export class HistoricalPriceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HistoricalPriceUnavailableError";
  }
}

export interface StockPriceResult {
  symbol: string;
  price: number;
  asOfDate: string;
  source: StockPriceSource;
  fetchedAt: number;
  isFallback?: boolean;
}

export interface StockPriceOptions {
  simulationDate?: string | null;
  simulationMode?: SimulationMode;
  simulatedDate?: string;
}

interface CacheEntry {
  data: StockPriceResult;
  fetchedAt: number;
}

const resolvedPriceCache = new Map<string, CacheEntry>();

const FINNHUB_TIMEOUT_MS = 5_000;
const POLYGON_TIMEOUT_MS = 6_000;

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function resolvePricingDate(options: StockPriceOptions): string | null {
  if (options.simulationMode !== undefined) {
    return resolveSimulationDate(
      options.simulationMode,
      options.simulatedDate ?? "",
    );
  }

  if (!options.simulationDate || options.simulationDate >= todayISO()) {
    return null;
  }

  return options.simulationDate;
}

function usesLivePricing(options: StockPriceOptions): boolean {
  return resolvePricingDate(options) === null;
}

function buildCacheKey(symbol: string, simulationDate?: string | null): string {
  return simulationDate ? `${symbol}:historical:${simulationDate}` : `${symbol}:live`;
}

function getCacheTtl(source: StockPriceSource): number {
  if (source === "historical") {
    return DAILY_SERIES_CACHE_TTL_MS;
  }
  return LIVE_QUOTE_CACHE_TTL_MS;
}

function getCachedPrice(cacheKey: string, allowStale = false): StockPriceResult | null {
  const entry = resolvedPriceCache.get(cacheKey);
  if (!entry) {
    return null;
  }

  const ttl = getCacheTtl(entry.data.source);
  const isFresh = Date.now() - entry.fetchedAt < ttl;

  if (isFresh || allowStale) {
    return entry.data;
  }

  return null;
}

function setCachedPrice(cacheKey: string, result: StockPriceResult): void {
  resolvedPriceCache.set(cacheKey, {
    data: result,
    fetchedAt: Date.now(),
  });
}

function createSimulationFallbackResult(
  symbol: string,
  asOfDate: string,
): StockPriceResult {
  return {
    symbol,
    price: generateSimulationPrice(symbol, asOfDate),
    asOfDate,
    source: "fallback",
    fetchedAt: Date.now(),
    isFallback: true,
  };
}

function isRetryableHistoricalError(error: unknown): boolean {
  if (error instanceof PolygonRateLimitError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("rate limit") ||
      message.includes("timed out") ||
      message.includes("empty") ||
      message.includes("invalid json") ||
      message.includes("request failed")
    );
  }

  return false;
}

async function tryFetchLivePrice(symbol: string): Promise<StockPriceResult | null> {
  try {
    const normalized = normalizeSymbol(symbol);
    const price = await withTimeout(
      fetchFinnhubLiveQuote(normalized),
      FINNHUB_TIMEOUT_MS,
      "Finnhub live quote",
    );

    if (!Number.isFinite(price) || price <= 0) {
      return null;
    }

    return {
      symbol: normalized,
      price,
      asOfDate: todayISO(),
      source: "live",
      fetchedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

async function fetchHistoricalPriceWithRetry(
  symbol: string,
  simulationDate: string,
): Promise<StockPriceResult> {
  const normalized = normalizeSymbol(symbol);
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= POLYGON_HISTORICAL_MAX_RETRIES; attempt += 1) {
    try {
      const price = await withTimeout(
        fetchPolygonHistoricalClose(normalized, simulationDate),
        POLYGON_TIMEOUT_MS,
        "Polygon historical close",
      );

      if (!Number.isFinite(price) || price <= 0) {
        throw new Error(
          `Empty historical price returned for ${normalized} on ${simulationDate}.`,
        );
      }

      return {
        symbol: normalized,
        price,
        asOfDate: simulationDate,
        source: "historical",
        fetchedAt: Date.now(),
      };
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error(`Historical price unavailable for ${normalized}.`);

      if (!isRetryableHistoricalError(error) || attempt >= POLYGON_HISTORICAL_MAX_RETRIES) {
        break;
      }

      await wait(POLYGON_HISTORICAL_RETRY_DELAY_MS);
    }
  }

  const stalePolygon = getStalePolygonHistoricalClose(normalized, simulationDate);
  if (stalePolygon !== null && stalePolygon > 0) {
    return {
      symbol: normalized,
      price: stalePolygon,
      asOfDate: simulationDate,
      source: "historical",
      fetchedAt: Date.now(),
    };
  }

  const cached = getCachedPrice(buildCacheKey(normalized, simulationDate), true);
  if (cached?.source === "historical") {
    return cached;
  }

  throw new HistoricalPriceUnavailableError(
    lastError?.message ??
      `Historical price unavailable for ${normalized} on ${simulationDate} after ${POLYGON_HISTORICAL_MAX_RETRIES} attempts.`,
  );
}

function resolveLivePriceWithFallback(symbol: string): StockPriceResult {
  const normalized = normalizeSymbol(symbol);
  const cacheKey = buildCacheKey(normalized, null);
  const stale = getCachedPrice(cacheKey, true);

  if (stale?.source === "live") {
    return stale;
  }

  const fallback = createSimulationFallbackResult(normalized, todayISO());
  setCachedPrice(cacheKey, fallback);
  return fallback;
}

export async function getStockPrice(
  symbol: string,
  options: StockPriceOptions = {},
): Promise<StockPriceResult> {
  const normalized = normalizeSymbol(symbol);

  if (!normalized) {
    return createSimulationFallbackResult("UNKNOWN", todayISO());
  }

  if (usesLivePricing(options)) {
    const cacheKey = buildCacheKey(normalized, null);
    const cachedLive = getCachedPrice(cacheKey);

    if (cachedLive?.source === "live") {
      return cachedLive;
    }

    const live = await tryFetchLivePrice(normalized);
    if (live) {
      setCachedPrice(cacheKey, live);
      return live;
    }

    return resolveLivePriceWithFallback(normalized);
  }

  const historicalDate = resolvePricingDate(options)!;
  const cacheKey = buildCacheKey(normalized, historicalDate);
  const cached = getCachedPrice(cacheKey);

  if (cached?.source === "historical") {
    return cached;
  }

  const historical = await fetchHistoricalPriceWithRetry(normalized, historicalDate);
  setCachedPrice(cacheKey, historical);
  return historical;
}

export async function getStockPrices(
  symbols: string[],
  options: StockPriceOptions = {},
): Promise<StockPriceResult[]> {
  const uniqueSymbols = [...new Set(symbols.map(normalizeSymbol))].filter(Boolean);
  const results: StockPriceResult[] = [];

  for (const symbol of uniqueSymbols) {
    results.push(await getStockPrice(symbol, options));
  }

  return results;
}

export { generateSimulationPrice };
