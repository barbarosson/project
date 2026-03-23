-- Beta referans kodu talepleri: admin onayı sonrası benzersiz kod üretilir

CREATE TABLE IF NOT EXISTS public.beta_reference_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reference_code text UNIQUE,
  decision_token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  rejected_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_beta_ref_email_lower ON public.beta_reference_requests (lower(email));
CREATE INDEX IF NOT EXISTS idx_beta_ref_decision_token ON public.beta_reference_requests (decision_token);
CREATE INDEX IF NOT EXISTS idx_beta_ref_reference_code ON public.beta_reference_requests (reference_code)
  WHERE reference_code IS NOT NULL;

-- Aynı e-posta için tek bekleyen talep
CREATE UNIQUE INDEX IF NOT EXISTS beta_ref_one_pending_per_email
  ON public.beta_reference_requests (lower(email))
  WHERE status = 'pending';

COMMENT ON TABLE public.beta_reference_requests IS 'Beta erişim referans kodu talepleri; onay linki decision_token ile';

ALTER TABLE public.beta_reference_requests ENABLE ROW LEVEL SECURITY;

-- Doğrudan istemci erişimi yok; yalnızca service role (API route)
