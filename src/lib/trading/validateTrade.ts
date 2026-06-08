import { calculateTradeAmounts } from "@/lib/trading/calculateTrade";
import { getStockPrice } from "@/lib/market/alphaVantage";
import {
  resolveSimulationDate,
  resolveTradeDate,
} from "@/lib/market/resolveSimulationDate";
import type { AmountMode, SimulationMode, TradeType } from "@/lib/types";

export interface TradeRequestBody {
  symbol: string;
  type: TradeType;
  amountMode: AmountMode;
  amount: number;
  simulationMode: SimulationMode;
  simulatedDate: string;
}

export interface ValidatedTrade {
  symbol: string;
  type: TradeType;
  shares: number;
  price: number;
  totalAmount: number;
  simulatedDate: string;
}

function validateTradeFields(body: Partial<TradeRequestBody>):
  | {
      success: true;
      symbol: string;
      type: TradeType;
      amountMode: AmountMode;
      amount: number;
      simulationMode: SimulationMode;
      simulatedDate: string;
    }
  | { success: false; error: string } {
  const symbol = body.symbol?.trim().toUpperCase() ?? "";
  const type = body.type;
  const amountMode = body.amountMode;
  const amount = body.amount;
  const simulationMode = body.simulationMode ?? "present";
  const simulatedDate = body.simulatedDate ?? "";

  if (!symbol) {
    return { success: false, error: "Please enter a stock symbol." };
  }

  if (type !== "BUY" && type !== "SELL") {
    return { success: false, error: "Trade type must be BUY or SELL." };
  }

  if (amountMode !== "eur" && amountMode !== "shares") {
    return { success: false, error: "Amount mode must be eur or shares." };
  }

  if (typeof amount !== "number" || amount <= 0 || !Number.isFinite(amount)) {
    return { success: false, error: "Amount must be a positive number." };
  }

  if (simulationMode === "simulated" && !simulatedDate) {
    return { success: false, error: "Please select a simulated date." };
  }

  return {
    success: true,
    symbol,
    type,
    amountMode,
    amount,
    simulationMode,
    simulatedDate,
  };
}

export async function validateTradeInput(
  body: Partial<TradeRequestBody>,
): Promise<
  { success: true; trade: ValidatedTrade } | { success: false; error: string }
> {
  const validation = validateTradeFields(body);

  if (!validation.success) {
    return validation;
  }

  const { symbol, type, amountMode, amount, simulationMode, simulatedDate } =
    validation;

  try {
    const quote = await getStockPrice(symbol, {
      simulationDate: resolveSimulationDate(simulationMode, simulatedDate),
    });

    const { shares, totalAmount } = calculateTradeAmounts(
      amount,
      amountMode,
      quote.price,
    );

    return {
      success: true,
      trade: {
        symbol,
        type,
        shares,
        price: quote.price,
        totalAmount,
        simulatedDate: resolveTradeDate(simulationMode, simulatedDate),
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Could not fetch price for "${symbol}".`,
    };
  }
}
