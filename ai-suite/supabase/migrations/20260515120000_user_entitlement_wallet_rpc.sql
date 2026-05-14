-- Wallet read for signed-in users without service role (uses JWT auth.uid()).

CREATE OR REPLACE FUNCTION public.user_entitlement_wallet()
RETURNS TABLE (
  credits_balance integer,
  max_versions_per_request integer,
  trial_ends_at timestamptz,
  subscription_status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, isendai
AS $$
  SELECT e.credits_balance, e.max_versions_per_request, e.trial_ends_at, e.subscription_status
  FROM isendai.entitlements e
  WHERE e.owner_type = 'user'
    AND e.owner_id = (auth.uid())::text;
$$;

REVOKE ALL ON FUNCTION public.user_entitlement_wallet() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_entitlement_wallet() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_entitlement_wallet() TO service_role;

NOTIFY pgrst, 'reload schema';
