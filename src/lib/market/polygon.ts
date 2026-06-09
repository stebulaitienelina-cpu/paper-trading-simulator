import {
  DAILY_SERIES_CACHE_TTL_MS,
  POLYGON_MAX_REQUESTS_PER_MINUTE,
  POLYGON_MIN_REQUEST_INTERVAL_MS,
} from "./constants";

interface PolygonOpenCloseResponse {
  status?: string;
  symbol?: string;
  from?: string;
  close?: number | string;
  open?: number | string;
  error?: string;
  message?: string;
}

interface CacheEntry {
  price: number;
  fetchedAt: number;
}

const historicalCloseCache = new Map<string, CacheEntry>();
const requestTimestamps: number[] = [];
let lastRequestAt = 0;

/** Max prior trading days to probe when the target date has no data (weekends/holidays). */
const MAX_PRIOR_DAY_LOOKUPS = 5;

export class PolygonRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PolygonRateLimitError";
  }
}

export class PolygonNoDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PolygonNoDataError";
  }
}

function getPolygonApiKey(): string {
  const key = process.env.POLYGON_API_KEY;
  if (!key) {
    throw new Error("Missing POLYGON_API_KEY. Add it to your .env.local file.");
  }
  return key;
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function cacheKey(symbol: string, date: string): string {
  return `${symbol}:${date}`;
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function throttlePolygonRequest(options?: { allowBurst?: boolean }): Promise<void> {
  const now = Date.now();

  while (
    requestTimestamps.length > 0 &&
    now - requestTimestamps[0] >= 60_000
  ) {
    requestTimestamps.shift();
  }

  if (requestTimestamps.length >= POLYGON_MAX_REQUESTS_PER_MINUTE) {
    throw new PolygonRateLimitError(
      "Polygon.io rate limit reached (5 requests/minute).",
    );
  }

  if (!options?.allowBurst) {
    const sinceLastRequest = Date.now() - lastRequestAt;
    if (sinceLastRequest < POLYGON_MIN_REQUEST_INTERVAL_MS) {
      await wait(POLYGON_MIN_REQUEST_INTERVAL_MS - sinceLastRequest);
    }
  }

  lastRequestAt = Date.now();
  requestTimestamps.push(lastRequestAt);
}

function isRateLimitResponse(status: number, payload: PolygonOpenCloseResponse): boolean {
  if (status === 429) {
    return true;
  }

  const message = `${payload.message ?? ""} ${payload.error ?? ""}`.toLowerCase();
  return message.includes("rate limit") || message.includes("too many");
}

function isNoDataResponse(status: number, payload: PolygonOpenCloseResponse): boolean {
  if (status === 404) {
    return true;
  }

  const normalizedStatus = payload.status?.toUpperCase();
  return normalizedStatus === "NOT_FOUND" || normalizedStatus === "NOT FOUND";
}

function parseClosePrice(payload: PolygonOpenCloseResponse): number | null {
  const raw = payload.close;
  if (raw === undefined || raw === null || raw === "") {
    return null;
  }

  const price = typeof raw === "number" ? raw : Number.parseFloat(String(raw));
  if (!Number.isFinite(price) || price <= 0) {
    return null;
  }

  return price;
}

function shiftDate(dateStr: string, offsetDays: number): string {
  const date = new Date(`${dateStr}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

/** Shift weekend dates to the preceding Friday before hitting the API. */
function getInitialQueryDate(targetDate: string): string {
  const date = new Date(`${targetDate}T12:00:00Z`);
  const day = date.getUTCDay();

  if (day === 6) {
    return shiftDate(targetDate, -1);
  }

  if (day === 0) {
    return shiftDate(targetDate, -2);
  }

  return targetDate;
}

async function fetchOpenCloseForDate(
  symbol: string,
  date: string,
): Promise<number> {
  const url = `https://api.polygon.io/v1/open-close/${symbol}/${date}?adjusted=true&apiKey=${getPolygonApiKey()}`;

  const response = await fetch(url, { next: { revalidate: 0 } });
  let payload: PolygonOpenCloseResponse;

  try {
    payload = (await response.json()) as PolygonOpenCloseResponse;
  } catch {
    throw new Error(`Polygon.io returned invalid JSON for ${symbol} on ${date}.`);
  }

  if (isRateLimitResponse(response.status, payload)) {
    throw new PolygonRateLimitError(
      payload.message ??
        payload.error ??
        "Polygon.io rate limit reached (5 requests/minute).",
    );
  }

  if (isNoDataResponse(response.status, payload)) {
    throw new PolygonNoDataError(`No market data for ${symbol} on ${date}.`);
  }

  const normalizedStatus = payload.status?.toUpperCase();
  if (normalizedStatus === "ERROR" || payload.error) {
    throw new Error(
      payload.message ?? payload.error ?? `Polygon.io error for ${symbol} on ${date}.`,
    );
  }

  const close = parseClosePrice(payload);
  if (normalizedStatus !== "OK" || close === null) {
    throw new Error(
      payload.message ??
        payload.error ??
        `Polygon.io request failed for ${symbol} on ${date}.`,
    );
  }

  return close;
}

function getCachedHistoricalClose(symbol: string, date: string): number | null {
  const cached = historicalCloseCache.get(cacheKey(symbol, date));
  if (!cached) {
    return null;
  }

  if (Date.now() - cached.fetchedAt < DAILY_SERIES_CACHE_TTL_MS) {
    return cached.price;
  }

  return null;
}

function setCachedHistoricalClose(symbol: string, date: string, price: number): void {
  historicalCloseCache.set(cacheKey(symbol, date), {
    price,
    fetchedAt: Date.now(),
  });
}

function getCachedPriorClose(symbol: string, targetDate: string): number | null {
  for (let offset = 1; offset <= MAX_PRIOR_DAY_LOOKUPS; offset += 1) {
    const priorDate = shiftDate(targetDate, -offset);
    const priorCached = getCachedHistoricalClose(symbol, priorDate);
    if (priorCached !== null) {
      return priorCached;
    }
  }

  return null;
}

export async function fetchPolygonHistoricalClose(
  symbol: string,
  targetDate: string,
): Promise<number> {
  const normalized = normalizeSymbol(symbol);
  const cached = getCachedHistoricalClose(normalized, targetDate);

  if (cached !== null) {
    return cached;
  }

  const cachedPrior = getCachedPriorClose(normalized, targetDate);
  if (cachedPrior !== null) {
    setCachedHistoricalClose(normalized, targetDate, cachedPrior);
    return cachedPrior;
  }

  const queryDates = [getInitialQueryDate(targetDate)];
  for (let offset = 1; offset <= MAX_PRIOR_DAY_LOOKUPS; offset += 1) {
    const priorDate = shiftDate(targetDate, -offset);
    if (!queryDates.includes(priorDate)) {
      queryDates.push(priorDate);
    }
  }

  let lastError: Error | null = null;
  let afterNoData = false;

  for (const queryDate of queryDates) {
    const queryCached = getCachedHistoricalClose(normalized, queryDate);
    if (queryCached !== null) {
      setCachedHistoricalClose(normalized, targetDate, queryCached);
      return queryCached;
    }

    try {
      await throttlePolygonRequest({ allowBurst: afterNoData });
      const price = await fetchOpenCloseForDate(normalized, queryDate);
      setCachedHistoricalClose(normalized, queryDate, price);
      setCachedHistoricalClose(normalized, targetDate, price);
      return price;
    } catch (error) {
      if (error instanceof PolygonRateLimitError) {
        throw error;
      }

      lastError =
        error instanceof Error
          ? error
          : new Error(`No historical closing price found for ${targetDate}.`);

      if (error instanceof PolygonNoDataError) {
        afterNoData = true;
        continue;
      }

      throw lastError;
    }
  }

  throw (
    lastError ??
    new PolygonNoDataError(`No historical closing price found for ${targetDate}.`)
  );
}

/** @deprecated Use fetchPolygonHistoricalClose — retries blocked UI; fallback is handled upstream. */
export async function fetchPolygonHistoricalCloseWithRetry(
  symbol: string,
  targetDate: string,
): Promise<number> {
  return fetchPolygonHistoricalClose(symbol, targetDate);
}

export function getStalePolygonHistoricalClose(
  symbol: string,
  targetDate: string,
): number | null {
  const normalized = normalizeSymbol(symbol);
  const direct = historicalCloseCache.get(cacheKey(normalized, targetDate));
  if (direct) {
    return direct.price;
  }

  return getCachedPriorClose(normalized, targetDate);
}
