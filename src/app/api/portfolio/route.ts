import { NextResponse } from "next/server";
import { fetchPortfolioState } from "@/lib/trading/portfolioService";

export async function GET() {
  try {
    const portfolio = await fetchPortfolioState();
    return NextResponse.json(portfolio);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load portfolio.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
