-- Optional retention purge for isendai.requests (+ versions via CASCADE).
-- Invoke from a secured cron (see /api/internal/purge-requests) or SQL Editor.

CREATE OR REPLACE FUNCTION isendai.purge_requests_older_than(p_days integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = isendai, public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  IF p_days IS NULL OR p_days < 30 THEN
    RAISE EXCEPTION 'retention_days_too_short';
  END IF;

  WITH doomed AS (
    DELETE FROM isendai.requests
    WHERE created_at < now() - make_interval(days => p_days)
    RETURNING id
  )
  SELECT count(*)::integer INTO deleted_count FROM doomed;

  RETURN COALESCE(deleted_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION isendai.purge_requests_older_than(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION isendai.purge_requests_older_than(integer) TO service_role;

CREATE OR REPLACE FUNCTION public.purge_requests_older_than(p_days integer)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = isendai, public
AS $$
  SELECT isendai.purge_requests_older_than(p_days);
$$;

REVOKE ALL ON FUNCTION public.purge_requests_older_than(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_requests_older_than(integer) TO service_role;
