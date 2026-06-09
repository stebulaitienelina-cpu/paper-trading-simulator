/** How often live quotes are refreshed in Present mode (ms). */
export const QUOTE_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

/** Server in-memory cache TTL for live quote responses (ms). */
export const LIVE_QUOTE_CACHE_TTL_MS = 30 * 60 * 1000;

/** Server in-memory cache TTL for historical candle responses (ms). */
export const DAILY_SERIES_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** Client-side quote cache TTL — reuse context quotes without re-fetching (ms). */
export const CLIENT_QUOTE_CACHE_TTL_MS = 30 * 60 * 1000;

/** Fallback price (EUR) when a live quote is temporarily unavailable. */
export const FALLBACK_MOCK_PRICE_EUR = 150;

/** Finnhub free tier: 60 requests/minute. */
export const FINNHUB_RATE_LIMIT_PER_MINUTE = 60;

/** Polygon.io free tier: 5 requests/minute. */
export const POLYGON_MAX_REQUESTS_PER_MINUTE = 5;

/** Minimum spacing between Polygon requests (ms). */
export const POLYGON_MIN_REQUEST_INTERVAL_MS = 12_000;

/** Historical Polygon retries when rate-limited or empty (stockPrices.ts). */
export const POLYGON_HISTORICAL_MAX_RETRIES = 3;

/** Delay between historical Polygon retries (ms). */
export const POLYGON_HISTORICAL_RETRY_DELAY_MS = 2_000;
