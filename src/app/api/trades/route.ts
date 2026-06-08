import { NextResponse } from "next/server";
import {
  executeTradeInDatabase,
  fetchPortfolioState,
  resolvePortfolioId,
} from "@/lib/trading/portfolioService";
import {
  validateTradeInput,
  type TradeRequestBody,
} from "@/lib/trading/validateTrade";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<TradeRequestBody>;
    const validation = await validateTradeInput(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const portfolioId = await resolvePortfolioId();

    await executeTradeInDatabase({
      portfolioId,
      symbol: validation.trade.symbol,
      type: validation.trade.type,
      shares: validation.trade.shares,
      price: validation.trade.price,
      totalAmount: validation.trade.totalAmount,
      simulatedDate: validation.trade.simulatedDate,
    });

    const portfolio = await fetchPortfolioState(portfolioId);

    return NextResponse.json({
      success: true,
      portfolio,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to execute trade.";
    const status = message.includes("Insufficient") ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
