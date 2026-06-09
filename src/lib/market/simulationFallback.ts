import { todayISO } from "@/lib/utils";

/** Realistic base prices (EUR) used when live/historical APIs are unavailable. */
const SYMBOL_BASE_PRICES: Record<string, number> = {
  AAPL: 180,
  TSLA: 170,
  MSFT: 420,
  GOOGL: 175,
  AMZN: 195,
  NVDA: 950,
  META: 520,
  NFLX: 620,
  AMD: 145,
  INTC: 35,
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function daysBetween(earlier: string, later: string): number {
  const start = new Date(`${earlier}T12:00:00Z`).getTime();
  const end = new Date(`${later}T12:00:00Z`).getTime();
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

function getBasePrice(symbol: string): number {
  const normalized = symbol.trim().toUpperCase();
  if (SYMBOL_BASE_PRICES[normalized]) {
    return SYMBOL_BASE_PRICES[normalized];
  }

  return 80 + (hashString(normalized) % 320);
}

/**
 * Deterministic simulated price for a symbol on a given date.
 * Same symbol + date always yields the same price; varies slightly by date.
 */
export function generateSimulationPrice(symbol: string, asOfDate: string): number {
  const normalized = symbol.trim().toUpperCase();
  const base = getBasePrice(normalized);
  const seed = hashString(`${normalized}:${asOfDate}`);
  const dailyJitter = 1 + ((seed % 1000) / 1000 - 0.5) * 0.1;

  const today = todayISO();
  const daysAgo = asOfDate < today ? daysBetween(asOfDate, today) : 0;
  const historicalFactor =
    daysAgo > 0
      ? 1 - Math.min(0.35, (daysAgo / 365) * 0.07) * (0.85 + (seed % 100) / 400)
      : 1;

  const price = base * dailyJitter * historicalFactor;
  return Math.round(price * 100) / 100;
}

export const API_FETCH_TIMEOUT_MS = 6_000;

export async function withTimeout<T>(
  promise: Promise<T>,
  ms = API_FETCH_TIMEOUT_MS,
  label = "API request",
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`${label} timed out after ${ms}ms`)),
          ms,
        );
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
