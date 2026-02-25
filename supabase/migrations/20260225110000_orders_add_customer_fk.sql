/*
  # orders -> customers foreign key

  PostgREST/Supabase embed (orders + customers) için schema cache'de
  ilişki gerekir. orders.customer_id -> customers.id FK ekleniyor.
*/

-- orders.customer_id -> customers.id (PostgREST embed için gerekli)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'orders'
      AND constraint_name = 'orders_customer_id_fkey'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
  END IF;
END $$;
