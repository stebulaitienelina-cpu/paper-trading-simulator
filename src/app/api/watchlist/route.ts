import { NextResponse } from "next/server";
import {
  addToWatchlist,
  fetchWatchlist,
  removeFromWatchlist,
} from "@/lib/watchlist/watchlistService";

export async function GET() {
  try {
    const items = await fetchWatchlist();
    return NextResponse.json({ items });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load watchlist.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { stockSymbol?: string };
    const item = await addToWatchlist(body.stockSymbol ?? "");
    return NextResponse.json({ item });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add to watchlist.";
    const status = message.includes("already") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stockSymbol = searchParams.get("stockSymbol") ?? "";

    await removeFromWatchlist(stockSymbol);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to remove from watchlist.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
