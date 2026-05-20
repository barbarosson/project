-- Run in Supabase SQL Editor (Dashboard → SQL → New query).

CREATE TABLE IF NOT EXISTS isendai.contact_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  user_id uuid,
  locale text,
  source_path text
);

CREATE INDEX IF NOT EXISTS contact_inquiries_created_at_idx
  ON isendai.contact_inquiries (created_at DESC);

ALTER TABLE isendai.contact_inquiries ENABLE ROW LEVEL SECURITY;
