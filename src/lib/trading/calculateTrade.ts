import type { AmountMode } from "@/lib/types";

export interface TradeAmounts {
  shares: number;
  totalAmount: number;
}

/**
 * EUR mode: deduct exactly the EUR amount entered and derive fractional shares.
 * Shares mode: use exact share count and derive total from price.
 */
export function calculateTradeAmounts(
  amount: number,
  amountMode: AmountMode,
  price: number,
): TradeAmounts {
  if (price <= 0 || !Number.isFinite(price)) {
    throw new Error("Invalid stock price.");
  }

  if (amountMode === "eur") {
    const totalAmount = Number(amount.toFixed(2));
    const shares = Number((totalAmount / price).toFixed(6));

    if (shares <= 0) {
      throw new Error("Trade amount is too small for the current price.");
    }

    return { shares, totalAmount };
  }

  const shares = Number(amount.toFixed(6));
  const totalAmount = Number((shares * price).toFixed(2));

  if (shares <= 0 || totalAmount <= 0) {
    throw new Error("Trade amount is too small.");
  }

  return { shares, totalAmount };
}
