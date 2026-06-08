-- Run in Supabase SQL Editor to fix fractional EUR-based trades.
-- Adds explicit total_amount so cash is deducted exactly as entered.

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
