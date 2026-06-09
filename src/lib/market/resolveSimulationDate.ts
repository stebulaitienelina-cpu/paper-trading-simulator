import type { LiveStockQuote, SimulationMode } from "@/lib/types";
import { todayISO } from "@/lib/utils";
import { CLIENT_QUOTE_CACHE_TTL_MS } from "./constants";

/**
 * Returns a past date for Polygon historical pricing, or null to use Finnhub live quotes.
 * Live pricing applies when mode is "present", the date is today/future, or the date is missing.
 */
export function resolveSimulationDate(
  simulationMode: SimulationMode,
  simulatedDate: string,
): string | null {
  if (simulationMode !== "simulated") {
    return null;
  }

  if (!simulatedDate || simulatedDate >= todayISO()) {
    return null;
  }

  return simulatedDate;
}

export function resolveTradeDate(
  simulationMode: SimulationMode,
  simulatedDate: string,
): string {
  return simulationMode === "simulated" ? simulatedDate : todayISO();
}

export function isHistoricalSimulationDate(date: string): boolean {
  return date < todayISO();
}

export function usesLivePricing(
  simulationMode: SimulationMode,
  simulatedDate: string,
): boolean {
  return resolveSimulationDate(simulationMode, simulatedDate) === null;
}

/** Whether a cached/fetched quote belongs to the current simulation context. */
export function isQuoteMatchingContext(
  quote: LiveStockQuote,
  simulationMode: SimulationMode,
  simulatedDate: string,
): boolean {
  if (usesLivePricing(simulationMode, simulatedDate)) {
    return quote.source === "live" || quote.source === "fallback";
  }

  const historicalDate = resolveSimulationDate(simulationMode, simulatedDate);
  return (
    quote.asOfDate === historicalDate && quote.source === "historical"
  );
}

export function isQuoteValidForSimulation(
  quote: LiveStockQuote,
  simulationMode: SimulationMode,
  simulatedDate: string,
): boolean {
  if (!isQuoteMatchingContext(quote, simulationMode, simulatedDate)) {
    return false;
  }

  return Date.now() - quote.fetchedAt < CLIENT_QUOTE_CACHE_TTL_MS;
}

/** @deprecated Use isQuoteMatchingContext for display checks. */
export function getExpectedQuoteDate(
  simulationMode: SimulationMode,
  simulatedDate: string,
): string {
  const historicalDate = resolveSimulationDate(simulationMode, simulatedDate);
  return historicalDate ?? todayISO();
}
