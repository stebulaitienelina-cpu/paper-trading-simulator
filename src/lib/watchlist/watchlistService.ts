import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { WatchlistItem } from "@/lib/types";

export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000002";

export function resolveUserId(): string {
  return process.env.DEFAULT_USER_ID ?? DEFAULT_USER_ID;
}

export async function fetchWatchlist(userId?: string): Promise<WatchlistItem[]> {
  const supabase = createServerSupabaseClient();
  const id = userId ?? resolveUserId();

  const { data, error } = await supabase
    .from("watchlist")
    .select("*")
    .eq("user_id", id)
    .order("stock_symbol", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    stockSymbol: row.stock_symbol,
    createdAt: new Date(row.created_at).getTime(),
  }));
}

export async function addToWatchlist(
  stockSymbol: string,
  userId?: string,
): Promise<WatchlistItem> {
  const supabase = createServerSupabaseClient();
  const id = userId ?? resolveUserId();
  const symbol = stockSymbol.trim().toUpperCase();

  if (!symbol) {
    throw new Error("Stock symbol is required.");
  }

  const { data, error } = await supabase
    .from("watchlist")
    .insert({ user_id: id, stock_symbol: symbol })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(`${symbol} is already on your watchlist.`);
    }
    throw new Error(error.message);
  }

  return {
    id: data.id,
    userId: data.user_id,
    stockSymbol: data.stock_symbol,
    createdAt: new Date(data.created_at).getTime(),
  };
}

export async function removeFromWatchlist(
  stockSymbol: string,
  userId?: string,
): Promise<void> {
  const supabase = createServerSupabaseClient();
  const id = userId ?? resolveUserId();
  const symbol = stockSymbol.trim().toUpperCase();

  const { error } = await supabase
    .from("watchlist")
    .delete()
    .eq("user_id", id)
    .eq("stock_symbol", symbol);

  if (error) {
    throw new Error(error.message);
  }
}
