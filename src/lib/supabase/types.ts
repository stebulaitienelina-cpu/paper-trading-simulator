export interface Database {
  public: {
    Tables: {
      portfolios: {
        Row: {
          id: string;
          name: string;
          cash_balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string;
          cash_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          cash_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      positions: {
        Row: {
          id: string;
          portfolio_id: string;
          symbol: string;
          shares: number;
          avg_cost: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          portfolio_id: string;
          symbol: string;
          shares: number;
          avg_cost: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          portfolio_id?: string;
          symbol?: string;
          shares?: number;
          avg_cost?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "positions_portfolio_id_fkey";
            columns: ["portfolio_id"];
            isOneToOne: false;
            referencedRelation: "portfolios";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          id: string;
          portfolio_id: string;
          symbol: string;
          type: "BUY" | "SELL";
          shares: number;
          price: number;
          total_amount: number;
          simulated_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          portfolio_id: string;
          symbol: string;
          type: "BUY" | "SELL";
          shares: number;
          price: number;
          total_amount: number;
          simulated_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          portfolio_id?: string;
          symbol?: string;
          type?: "BUY" | "SELL";
          shares?: number;
          price?: number;
          total_amount?: number;
          simulated_date?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_portfolio_id_fkey";
            columns: ["portfolio_id"];
            isOneToOne: false;
            referencedRelation: "portfolios";
            referencedColumns: ["id"];
          },
        ];
      };
      watchlist: {
        Row: {
          id: string;
          user_id: string;
          stock_symbol: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stock_symbol: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stock_symbol?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      execute_trade: {
        Args: {
          p_portfolio_id: string;
          p_symbol: string;
          p_type: string;
          p_shares: number;
          p_price: number;
          p_total_amount: number;
          p_simulated_date: string;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
