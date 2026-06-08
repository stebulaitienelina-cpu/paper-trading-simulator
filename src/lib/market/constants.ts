/** How often live quotes are refreshed in Present mode (ms). */
export const QUOTE_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

/** Server in-memory cache TTL for live GLOBAL_QUOTE responses (ms). */
export const LIVE_QUOTE_CACHE_TTL_MS = 30 * 60 * 1000;

/** Server in-memory cache TTL for TIME_SERIES_DAILY responses (ms). */
export const DAILY_SERIES_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** Client-side quote cache TTL — reuse context quotes without re-fetching (ms). */
export const CLIENT_QUOTE_CACHE_TTL_MS = 30 * 60 * 1000;

/** Fallback price (EUR) when Alpha Vantage rate limit is hit during testing. */
export const FALLBACK_MOCK_PRICE_EUR = 150;
