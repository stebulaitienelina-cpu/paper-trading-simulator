import { usesLivePricing } from "./resolveSimulationDate";
import { generateSimulationPrice } from "./simulationFallback";
import type { LiveStockQuote, SimulationMode } from "@/lib/types";
import { todayISO } from "@/lib/utils";

export function createClientFallbackQuote(
  symbol: string,
  simulationMode: SimulationMode,
  simulatedDate: string,
): LiveStockQuote {
  const normalized = symbol.trim().toUpperCase();
  const asOfDate = usesLivePricing(simulationMode, simulatedDate)
    ? todayISO()
    : simulatedDate;

  return {
    symbol: normalized,
    price: generateSimulationPrice(normalized, asOfDate),
    asOfDate,
    source: "fallback",
    fetchedAt: Date.now(),
    isFallback: true,
  };
}

export const CLIENT_QUOTE_FETCH_TIMEOUT_MS = 8_000;

/** Allow time for server-side Polygon retries (3 × ~6s + 2s gaps). */
export const CLIENT_HISTORICAL_QUOTE_FETCH_TIMEOUT_MS = 30_000;
