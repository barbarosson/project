-- Run in Supabase SQL Editor (Dashboard → SQL → New query).

CREATE TABLE IF NOT EXISTS isendai.ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type text CHECK (owner_type IS NULL OR owner_type IN ('user', 'anon')),
  owner_id text,
  tool_id text NOT NULL,
  original_text text NOT NULL,
  ai_response text NOT NULL,
  rating text NOT NULL CHECK (rating IN ('up', 'down')),
  model_used text NOT NULL,
  request_id uuid REFERENCES isendai.requests (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_feedback_tool_rating_created_idx
  ON isendai.ai_feedback (tool_id, rating, created_at DESC);

CREATE INDEX IF NOT EXISTS ai_feedback_up_tool_idx
  ON isendai.ai_feedback (tool_id, created_at DESC)
  WHERE rating = 'up';

ALTER TABLE isendai.ai_feedback ENABLE ROW LEVEL SECURITY;
