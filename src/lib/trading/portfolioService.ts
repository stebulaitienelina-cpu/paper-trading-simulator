import { STARTING_BALANCE } from "@/lib/mockData";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { PortfolioState } from "@/lib/types";

const DEFAULT_PORTFOLIO_ID = "00000000-0000-0000-0000-000000000001";

function toNumber(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

export async function resolvePortfolioId(): Promise<string> {
  const configuredId = process.env.DEFAULT_PORTFOLIO_ID;
  if (configuredId) {
    return configuredId;
  }

  const supabase = createServerSupabaseClient();

  const { data: existing, error: fetchError } = await supabase
    .from("portfolios")
    .select("id")
    .eq("name", "default")
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (existing) {
    return existing.id;
  }

  const { data: created, error: createError } = await supabase
    .from("portfolios")
    .insert({ name: "default", cash_balance: STARTING_BALANCE })
    .select("id")
    .single();

  if (createError) {
    throw new Error(createError.message);
  }

  return created.id;
}

export async function fetchPortfolioState(
  portfolioId?: string,
): Promise<PortfolioState & { portfolioId: string }> {
  const supabase = createServerSupabaseClient();
  const id = portfolioId ?? (await resolvePortfolioId());

  const [portfolioResult, positionsResult, transactionsResult] = await Promise.all([
    supabase.from("portfolios").select("*").eq("id", id).single(),
    supabase
      .from("positions")
      .select("*")
      .eq("portfolio_id", id)
      .order("symbol", { ascending: true }),
    supabase
      .from("transactions")
      .select("*")
      .eq("portfolio_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (portfolioResult.error) {
    throw new Error(portfolioResult.error.message);
  }
  if (positionsResult.error) {
    throw new Error(positionsResult.error.message);
  }
  if (transactionsResult.error) {
    throw new Error(transactionsResult.error.message);
  }

  return {
    portfolioId: portfolioResult.data.id,
    cashBalance: toNumber(portfolioResult.data.cash_balance),
    positions: (positionsResult.data ?? []).map((row) => ({
      symbol: row.symbol,
      shares: toNumber(row.shares),
      avgCost: toNumber(row.avg_cost),
    })),
    transactions: (transactionsResult.data ?? []).map((row) => ({
      id: row.id,
      symbol: row.symbol,
      type: row.type,
      shares: toNumber(row.shares),
      price: toNumber(row.price),
      totalAmount: toNumber(row.total_amount),
      simulatedDate: row.simulated_date,
      createdAt: new Date(row.created_at).getTime(),
    })),
  };
}

export async function executeTradeInDatabase(input: {
  portfolioId: string;
  symbol: string;
  type: "BUY" | "SELL";
  shares: number;
  price: number;
  totalAmount: number;
  simulatedDate: string;
}): Promise<string> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase.rpc("execute_trade", {
    p_portfolio_id: input.portfolioId,
    p_symbol: input.symbol,
    p_type: input.type,
    p_shares: input.shares,
    p_price: input.price,
    p_total_amount: input.totalAmount,
    p_simulated_date: input.simulatedDate,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export { DEFAULT_PORTFOLIO_ID };
