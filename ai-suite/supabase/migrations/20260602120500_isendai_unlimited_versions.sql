-- Allow generating more than 5 alternatives as long as credits allow.
-- Note: UI may still cap how many versions are cached client-side; DB retains all.

ALTER TABLE isendai.entitlements
  ALTER COLUMN max_versions_per_request SET DEFAULT 9999;

-- Upgrade existing signed-in users.
UPDATE isendai.entitlements
SET max_versions_per_request = 9999
WHERE owner_type = 'user'
  AND COALESCE(max_versions_per_request, 0) < 9999;

-- Remove per-request version cap enforced by requests.max_versions.
CREATE OR REPLACE FUNCTION isendai.add_request_version(
  p_request_id uuid,
  p_text text
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = isendai, public
AS $$
DECLARE
  current_max integer;
  next_idx integer;
BEGIN
  PERFORM 1
  FROM isendai.requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'request_not_found';
  END IF;

  SELECT COALESCE(MAX(idx), 0) INTO current_max
  FROM isendai.request_versions
  WHERE request_id = p_request_id;

  next_idx := current_max + 1;

  INSERT INTO isendai.request_versions (request_id, idx, text)
  VALUES (p_request_id, next_idx, p_text);

  RETURN next_idx;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_request_version(
  p_request_id uuid,
  p_text text
) RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, isendai
AS $$
  SELECT isendai.add_request_version(p_request_id, p_text);
$$;

NOTIFY pgrst, 'reload schema';

