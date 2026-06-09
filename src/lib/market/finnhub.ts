import { LIVE_QUOTE_CACHE_TTL_MS } from "./constants";

interface FinnhubQuoteResponse {
  c: number;
  h: number;
  l: number;
  o: number;
  pc: number;
  t: number;
}

interface CacheEntry {
  data: number;
  fetchedAt: number;
}

const liveQuoteCache = new Map<string, CacheEntry>();

function getFinnhubApiKey(): string {
  const key = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
  if (!key) {
    throw new Error("Missing FINNHUB_API_KEY. Add it to your .env.local file.");
  }
  return key;
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

export async function fetchFinnhubLiveQuote(symbol: string): Promise<number> {
  const normalized = normalizeSymbol(symbol);
  const cached = liveQuoteCache.get(normalized);

  if (cached && Date.now() - cached.fetchedAt < LIVE_QUOTE_CACHE_TTL_MS) {
    return cached.data;
  }

  const url = new URL("https://finnhub.io/api/v1/quote");
  url.searchParams.set("symbol", normalized);
  url.searchParams.set("token", getFinnhubApiKey());

  const response = await fetch(url.toString(), { next: { revalidate: 0 } });

  if (!response.ok) {
    throw new Error(`Finnhub request failed (${response.status}).`);
  }

  const payload = (await response.json()) as FinnhubQuoteResponse;

  if (!Number.isFinite(payload.c) || payload.c <= 0) {
    throw new Error(`No live quote found for symbol "${normalized}".`);
  }

  liveQuoteCache.set(normalized, { data: payload.c, fetchedAt: Date.now() });
  return payload.c;
}
