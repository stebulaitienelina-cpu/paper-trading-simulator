export type TabId = "portfolio" | "trade" | "history" | "watchlist";

export type TradeType = "BUY" | "SELL";

export type SimulationMode = "present" | "simulated";

export type AmountMode = "eur" | "shares";

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
}

export interface LiveStockQuote {
  symbol: string;
  price: number;
  asOfDate: string;
  source: "live" | "historical" | "fallback";
  fetchedAt: number;
  isFallback?: boolean;
}

export interface Position {
  symbol: string;
  shares: number;
  avgCost: number;
}

export interface Transaction {
  id: string;
  symbol: string;
  type: TradeType;
  shares: number;
  price: number;
  totalAmount: number;
  simulatedDate: string;
  createdAt: number;
}

export interface PortfolioState {
  cashBalance: number;
  positions: Position[];
  transactions: Transaction[];
}

export interface WatchlistItem {
  id: string;
  userId: string;
  stockSymbol: string;
  createdAt: number;
}
