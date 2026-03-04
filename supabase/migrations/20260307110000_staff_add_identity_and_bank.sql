-- Extend staff table with identity and bank information.
-- - last_name: personnel surname
-- - national_id: TCKN (optional, 11-digit text)
-- - bank_name, bank_iban, bank_account_number: basic bank info for salary/advance payments

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE public.staff
      ADD COLUMN last_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'national_id'
  ) THEN
    ALTER TABLE public.staff
      ADD COLUMN national_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'bank_name'
  ) THEN
    ALTER TABLE public.staff
      ADD COLUMN bank_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'bank_iban'
  ) THEN
    ALTER TABLE public.staff
      ADD COLUMN bank_iban text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'bank_account_number'
  ) THEN
    ALTER TABLE public.staff
      ADD COLUMN bank_account_number text;
  END IF;
END $$;

