import {
  DAILY_SERIES_CACHE_TTL_MS,
  FALLBACK_MOCK_PRICE_EUR,
  LIVE_QUOTE_CACHE_TTL_MS,
} from "./constants";
import { AlphaVantageRateLimitError, isAlphaVantageRateLimitError } from "./rateLimit";

export type StockPriceSource = "live" | "historical" | "fallback";

export interface StockPriceResult {
  symbol: string;
  price: number;
  asOfDate: string;
  source: StockPriceSource;
  fetchedAt: number;
  isFallback?: boolean;
}

interface DailyBar {
  close: string;
}

type DailySeries = Record<string, DailyBar>;

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

const liveQuoteCache = new Map<string, CacheEntry<number>>();
const dailySeriesCache = new Map<string, CacheEntry<DailySeries>>();
const resolvedPriceCache = new Map<string, CacheEntry<StockPriceResult>>();

function getApiKey(): string {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) {
    throw new Error("Missing ALPHA_VANTAGE_API_KEY. Add it to your .env.local file.");
  }
  return key;
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
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

function createFallbackResult(
  symbol: string,
  simulationDate?: string | null,
): StockPriceResult {
  return {
    symbol,
    price: FALLBACK_MOCK_PRICE_EUR,
    asOfDate: simulationDate ?? new Date().toISOString().slice(0, 10),
    source: "fallback",
    fetchedAt: Date.now(),
    isFallback: true,
  };
}

function parseAlphaVantageError(payload: Record<string, unknown>): string | null {
  const note = payload.Note ?? payload.Information ?? payload["Error Message"];
  return typeof note === "string" ? note : null;
}

async function fetchAlphaVantage(
  params: Record<string, string>,
): Promise<Record<string, unknown>> {
  const url = new URL("https://www.alphavantage.co/query");
  url.searchParams.set("apikey", getApiKey());

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Alpha Vantage request failed (${response.status}).`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const errorMessage = parseAlphaVantageError(payload);

  if (errorMessage) {
    if (isAlphaVantageRateLimitError(errorMessage)) {
      throw new AlphaVantageRateLimitError(errorMessage);
    }
    throw new Error(errorMessage);
  }

  return payload;
}

async function fetchLiveQuote(symbol: string): Promise<number> {
  const normalized = normalizeSymbol(symbol);
  const cached = liveQuoteCache.get(normalized);

  if (cached && Date.now() - cached.fetchedAt < LIVE_QUOTE_CACHE_TTL_MS) {
    return cached.data;
  }

  const payload = await fetchAlphaVantage({
    function: "GLOBAL_QUOTE",
    symbol: normalized,
  });

  const quote = payload["Global Quote"] as Record<string, string> | undefined;
  const price = quote?.["05. price"];

  if (!price) {
    throw new Error(`No live quote found for symbol "${normalized}".`);
  }

  const parsed = Number.parseFloat(price);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid live quote price for "${normalized}".`);
  }

  liveQuoteCache.set(normalized, { data: parsed, fetchedAt: Date.now() });
  return parsed;
}

async function fetchDailySeries(symbol: string): Promise<DailySeries> {
  const normalized = normalizeSymbol(symbol);
  const cached = dailySeriesCache.get(normalized);

  if (cached && Date.now() - cached.fetchedAt < DAILY_SERIES_CACHE_TTL_MS) {
    return cached.data;
  }

  const payload = await fetchAlphaVantage({
    function: "TIME_SERIES_DAILY",
    symbol: normalized,
    outputsize: "full",
  });

  const rawSeries = payload["Time Series (Daily)"] as
    | Record<string, Record<string, string>>
    | undefined;

  if (!rawSeries || Object.keys(rawSeries).length === 0) {
    throw new Error(`No historical data found for symbol "${normalized}".`);
  }

  const series: DailySeries = {};
  for (const [date, bar] of Object.entries(rawSeries)) {
    series[date] = { close: bar["4. close"] };
  }

  dailySeriesCache.set(normalized, { data: series, fetchedAt: Date.now() });
  return series;
}

function findHistoricalClose(series: DailySeries, targetDate: string): number {
  if (series[targetDate]) {
    return Number.parseFloat(series[targetDate].close);
  }

  const target = new Date(`${targetDate}T12:00:00Z`);

  for (let offset = 1; offset <= 14; offset += 1) {
    const candidate = new Date(target);
    candidate.setUTCDate(candidate.getUTCDate() - offset);
    const key = candidate.toISOString().slice(0, 10);

    if (series[key]) {
      return Number.parseFloat(series[key].close);
    }
  }

  throw new Error(
    `No historical closing price found for ${targetDate} (or nearby trading days).`,
  );
}

async function fetchPriceFromApi(
  symbol: string,
  simulationDate?: string | null,
): Promise<StockPriceResult> {
  const normalized = normalizeSymbol(symbol);
  const fetchedAt = Date.now();

  if (simulationDate) {
    const series = await fetchDailySeries(normalized);
    const price = findHistoricalClose(series, simulationDate);

    return {
      symbol: normalized,
      price,
      asOfDate: simulationDate,
      source: "historical",
      fetchedAt,
    };
  }

  const price = await fetchLiveQuote(normalized);

  return {
    symbol: normalized,
    price,
    asOfDate: new Date().toISOString().slice(0, 10),
    source: "live",
    fetchedAt,
  };
}

function resolvePriceWithFallback(
  symbol: string,
  simulationDate: string | null | undefined,
  error: unknown,
): StockPriceResult {
  const normalized = normalizeSymbol(symbol);
  const cacheKey = buildCacheKey(normalized, simulationDate);
  const stale = getCachedPrice(cacheKey, true);

  if (stale && stale.source !== "fallback") {
    return stale;
  }

  const isRateLimit =
    error instanceof AlphaVantageRateLimitError ||
    (error instanceof Error && isAlphaVantageRateLimitError(error.message));

  if (isRateLimit) {
    const fallback = createFallbackResult(normalized, simulationDate);
    setCachedPrice(cacheKey, fallback);
    return fallback;
  }

  throw error instanceof Error
    ? error
    : new Error(`Could not fetch price for "${normalized}".`);
}

export async function getStockPrice(
  symbol: string,
  options: { simulationDate?: string | null } = {},
): Promise<StockPriceResult> {
  const normalized = normalizeSymbol(symbol);
  const cacheKey = buildCacheKey(normalized, options.simulationDate);
  const cached = getCachedPrice(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const result = await fetchPriceFromApi(normalized, options.simulationDate);
    setCachedPrice(cacheKey, result);
    return result;
  } catch (error) {
    return resolvePriceWithFallback(normalized, options.simulationDate, error);
  }
}

export async function getStockPrices(
  symbols: string[],
  options: { simulationDate?: string | null } = {},
): Promise<StockPriceResult[]> {
  const uniqueSymbols = [...new Set(symbols.map(normalizeSymbol))].filter(Boolean);

  const results: StockPriceResult[] = [];

  for (const symbol of uniqueSymbols) {
    results.push(await getStockPrice(symbol, options));
  }

  return results;
}
