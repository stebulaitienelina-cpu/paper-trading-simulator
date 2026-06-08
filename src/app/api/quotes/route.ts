import { NextResponse } from "next/server";
import { getStockPrices } from "@/lib/market/alphaVantage";
import { resolveSimulationDate } from "@/lib/market/resolveSimulationDate";
import type { SimulationMode } from "@/lib/types";

export async function GET(request: Request) {
  try {
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

    const quotes = await getStockPrices(symbols, {
      simulationDate: resolveSimulationDate(simulationMode, simulatedDate),
    });

    const fetchedAt = quotes.reduce(
      (latest, quote) => Math.max(latest, quote.fetchedAt),
      Date.now(),
    );

    const usingFallback = quotes.some((quote) => quote.source === "fallback");

    return NextResponse.json({
      quotes,
      lastUpdated: fetchedAt,
      usingFallback,
      warning: usingFallback
        ? "Alpha Vantage rate limit reached. Showing cached or fallback test prices (€150) so you can keep testing."
        : null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch stock quotes.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
