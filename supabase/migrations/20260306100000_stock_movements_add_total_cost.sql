/*
  # stock_movements.total_cost

  handle_po_received trigger inserts total_cost; column was missing.
*/
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stock_movements' AND column_name = 'total_cost'
  ) THEN
    ALTER TABLE public.stock_movements ADD COLUMN total_cost numeric DEFAULT 0;
  END IF;
END $$;
