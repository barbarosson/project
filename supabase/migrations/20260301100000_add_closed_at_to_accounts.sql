-- Add closed_at to accounts for "aktiflik sonu" (activity end date)
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS closed_at timestamptz NULL;
COMMENT ON COLUMN accounts.closed_at IS 'When the account was closed / end of activity date';
