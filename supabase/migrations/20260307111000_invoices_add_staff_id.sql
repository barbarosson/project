-- Allow linking sales invoices to a staff member (e.g. salesperson).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'staff_id'
  ) THEN
    ALTER TABLE public.invoices
      ADD COLUMN staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_invoices_staff_id ON public.invoices(staff_id);

