-- Idempotency for Lemon Squeezy webhooks (order_created credit grants)

CREATE TABLE IF NOT EXISTS isendai.lemon_processed_orders (
  order_identifier text PRIMARY KEY,
  owner_type text NOT NULL CHECK (owner_type IN ('user', 'anon')),
  owner_id text NOT NULL,
  tool_id text NOT NULL,
  credits_granted integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE isendai.lemon_processed_orders ENABLE ROW LEVEL SECURITY;
