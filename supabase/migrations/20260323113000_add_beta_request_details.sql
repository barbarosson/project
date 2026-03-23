ALTER TABLE public.beta_reference_requests
  ADD COLUMN IF NOT EXISTS company_title text,
  ADD COLUMN IF NOT EXISTS contact_info text,
  ADD COLUMN IF NOT EXISTS website_info text,
  ADD COLUMN IF NOT EXISTS profession_group text,
  ADD COLUMN IF NOT EXISTS turnover_and_volume text;

COMMENT ON COLUMN public.beta_reference_requests.company_title IS 'Beta talep edenin sirket unvani';
COMMENT ON COLUMN public.beta_reference_requests.contact_info IS 'Talep eden iletisim bilgileri';
COMMENT ON COLUMN public.beta_reference_requests.website_info IS 'Web sitesi veya ilgili link bilgileri';
COMMENT ON COLUMN public.beta_reference_requests.profession_group IS 'Is kolu / meslek grubu';
COMMENT ON COLUMN public.beta_reference_requests.turnover_and_volume IS 'Ciro ve islem hacmi bilgileri';
