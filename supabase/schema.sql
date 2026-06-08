-- Paper Trading Simulator — Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query)

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'default',
  cash_balance NUMERIC(14, 2) NOT NULL DEFAULT 10000.00
    CHECK (cash_balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT portfolios_name_unique UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL CHECK (char_length(symbol) > 0),
  shares NUMERIC(14, 6) NOT NULL DEFAULT 0 CHECK (shares > 0),
  avg_cost NUMERIC(14, 4) NOT NULL DEFAULT 0 CHECK (avg_cost >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT positions_portfolio_symbol_unique UNIQUE (portfolio_id, symbol)
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL CHECK (char_length(symbol) > 0),
  type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
  shares NUMERIC(14, 6) NOT NULL CHECK (shares > 0),
  price NUMERIC(14, 4) NOT NULL CHECK (price > 0),
  total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount > 0),
  simulated_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  stock_symbol TEXT NOT NULL CHECK (char_length(stock_symbol) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT watchlist_user_symbol_unique UNIQUE (user_id, stock_symbol)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_positions_portfolio_id
  ON positions (portfolio_id);

CREATE INDEX IF NOT EXISTS idx_transactions_portfolio_id
  ON transactions (portfolio_id);

CREATE INDEX IF NOT EXISTS idx_transactions_simulated_date
  ON transactions (simulated_date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at
  ON transactions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_watchlist_user_id
  ON watchlist (user_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS portfolios_set_updated_at ON portfolios;
CREATE TRIGGER portfolios_set_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS positions_set_updated_at ON positions;
CREATE TRIGGER positions_set_updated_at
  BEFORE UPDATE ON positions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Atomic trade execution
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION execute_trade(
  p_portfolio_id UUID,
  p_symbol TEXT,
  p_type TEXT,
  p_shares NUMERIC,
  p_price NUMERIC,
  p_total_amount NUMERIC,
  p_simulated_date DATE
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_cash NUMERIC(14, 2);
  v_total NUMERIC(14, 2);
  v_position positions%ROWTYPE;
  v_new_shares NUMERIC(14, 6);
  v_new_avg NUMERIC(14, 4);
  v_remaining NUMERIC(14, 6);
  v_tx_id UUID;
BEGIN
  IF p_shares <= 0 OR p_price <= 0 OR p_total_amount <= 0 THEN
    RAISE EXCEPTION 'Shares, price, and total amount must be positive';
  END IF;

  IF p_type NOT IN ('BUY', 'SELL') THEN
    RAISE EXCEPTION 'Invalid trade type: %', p_type;
  END IF;

  p_symbol := UPPER(TRIM(p_symbol));
  v_total := ROUND(p_total_amount, 2);

  SELECT cash_balance
  INTO v_cash
  FROM portfolios
  WHERE id = p_portfolio_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Portfolio not found';
  END IF;

  IF p_type = 'BUY' THEN
    IF v_total > v_cash THEN
      RAISE EXCEPTION 'Insufficient funds. Need % EUR, have % EUR.', v_total, v_cash;
    END IF;

    UPDATE portfolios
    SET cash_balance = cash_balance - v_total
    WHERE id = p_portfolio_id;

    SELECT *
    INTO v_position
    FROM positions
    WHERE portfolio_id = p_portfolio_id
      AND symbol = p_symbol
    FOR UPDATE;

    IF FOUND THEN
      v_new_shares := v_position.shares + p_shares;
      v_new_avg := (v_position.shares * v_position.avg_cost + v_total) / v_new_shares;

      UPDATE positions
      SET shares = v_new_shares,
          avg_cost = v_new_avg
      WHERE id = v_position.id;
    ELSE
      INSERT INTO positions (portfolio_id, symbol, shares, avg_cost)
      VALUES (p_portfolio_id, p_symbol, p_shares, v_total / p_shares);
    END IF;
  ELSE
    SELECT *
    INTO v_position
    FROM positions
    WHERE portfolio_id = p_portfolio_id
      AND symbol = p_symbol
    FOR UPDATE;

    IF NOT FOUND OR v_position.shares < p_shares THEN
      RAISE EXCEPTION 'Insufficient shares. Requested %, available %.',
        p_shares,
        COALESCE(v_position.shares, 0);
    END IF;

    v_remaining := v_position.shares - p_shares;

    IF v_remaining <= 0.0001 THEN
      DELETE FROM positions WHERE id = v_position.id;
    ELSE
      UPDATE positions
      SET shares = v_remaining
      WHERE id = v_position.id;
    END IF;

    UPDATE portfolios
    SET cash_balance = cash_balance + v_total
    WHERE id = p_portfolio_id;
  END IF;

  INSERT INTO transactions (
    portfolio_id,
    symbol,
    type,
    shares,
    price,
    total_amount,
    simulated_date
  )
  VALUES (
    p_portfolio_id,
    p_symbol,
    p_type,
    p_shares,
    p_price,
    v_total,
    p_simulated_date
  )
  RETURNING id INTO v_tx_id;

  RETURN v_tx_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security (permissive for now — tighten when auth is added)
-- ---------------------------------------------------------------------------

ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to portfolios" ON portfolios;
CREATE POLICY "Allow all access to portfolios"
  ON portfolios FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to positions" ON positions;
CREATE POLICY "Allow all access to positions"
  ON positions FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to transactions" ON transactions;
CREATE POLICY "Allow all access to transactions"
  ON transactions FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to watchlist" ON watchlist;
CREATE POLICY "Allow all access to watchlist"
  ON watchlist FOR ALL
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Seed: default portfolio matching the local mock data
-- ---------------------------------------------------------------------------

INSERT INTO portfolios (id, name, cash_balance)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'default',
  9924.11
)
ON CONFLICT (name) DO NOTHING;

INSERT INTO positions (portfolio_id, symbol, shares, avg_cost)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'AAPL', 0.15, 178.42),
  ('00000000-0000-0000-0000-000000000001', 'TSLA', 0.20, 245.65)
ON CONFLICT (portfolio_id, symbol) DO NOTHING;

INSERT INTO transactions (
  portfolio_id,
  symbol,
  type,
  shares,
  price,
  total_amount,
  simulated_date,
  created_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'AAPL',
    'BUY',
    0.15,
    178.42,
    26.76,
    '2026-06-01',
    now() - interval '7 days'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'TSLA',
    'BUY',
    0.20,
    245.65,
    49.13,
    '2026-06-03',
    now() - interval '5 days'
  );

INSERT INTO watchlist (user_id, stock_symbol)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'AAPL'),
  ('00000000-0000-0000-0000-000000000002', 'TSLA')
ON CONFLICT (user_id, stock_symbol) DO NOTHING;
