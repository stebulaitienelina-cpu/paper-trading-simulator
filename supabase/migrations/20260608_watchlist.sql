-- Watchlist table for tracking saved stock symbols per user.

CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  stock_symbol TEXT NOT NULL CHECK (char_length(stock_symbol) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT watchlist_user_symbol_unique UNIQUE (user_id, stock_symbol)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user_id
  ON watchlist (user_id);

ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to watchlist" ON watchlist;
CREATE POLICY "Allow all access to watchlist"
  ON watchlist FOR ALL
  USING (true)
  WITH CHECK (true);

-- Default demo user (until auth is added)
INSERT INTO watchlist (user_id, stock_symbol)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'AAPL'),
  ('00000000-0000-0000-0000-000000000002', 'TSLA')
ON CONFLICT (user_id, stock_symbol) DO NOTHING;
