import { NextResponse } from "next/server";
import { generateSimulationPrice } from "@/lib/market/simulationFallback";
import {
  HistoricalPriceUnavailableError,
  getStockPrices,
} from "@/lib/market/stockPrices";
import { resolveSimulationDate } from "@/lib/market/resolveSimulationDate";
import type { SimulationMode } from "@/lib/types";
import { todayISO } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols") ?? "";
  const simulationMode =
    (searchParams.get("simulationMode") as SimulationMode) ?? "present";
  const simulatedDate = searchParams.get("simulatedDate") ?? "";

  const symbols = symbolsParam
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean);

  if (symbols.length === 0) {
    return NextResponse.json(
      { error: "Provide at least one symbol via ?symbols=AAPL,TSLA" },
      { status: 400 },
    );
  }

  const historicalDate = resolveSimulationDate(simulationMode, simulatedDate);
  const asOfDate = historicalDate ?? todayISO();

  try {
    const quotes = await getStockPrices(symbols, {
      simulationMode,
      simulatedDate,
    });

    const fetchedAt = quotes.reduce(
      (latest, quote) => Math.max(latest, quote.fetchedAt),
      Date.now(),
    );

    const usingFallback = quotes.some((quote) => quote.source === "fallback");

    let warning: string | null = null;
    if (usingFallback) {
      warning =
        "Live API unavailable for some symbols. Showing simulated prices.";
    }

    return NextResponse.json({
      quotes,
      lastUpdated: fetchedAt,
      usingFallback,
      warning,
    });
  } catch (error) {
    if (historicalDate) {
      const message =
        error instanceof HistoricalPriceUnavailableError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Historical price unavailable.";

      return NextResponse.json({ error: message }, { status: 503 });
    }

    const quotes = symbols.map((symbol) => ({
      symbol,
      price: generateSimulationPrice(symbol, asOfDate),
      asOfDate,
      source: "fallback" as const,
      fetchedAt: Date.now(),
      isFallback: true,
    }));

    return NextResponse.json({
      quotes,
      lastUpdated: Date.now(),
      usingFallback: true,
      warning: "Live API unavailable. Showing simulated prices.",
    });
  }
}
