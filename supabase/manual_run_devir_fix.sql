-- Supabase SQL Editor'da çalıştırın (supabase link olmadan)
-- 1) Trigger düzeltmesi - gelecek devir faturaları sent kalacak
CREATE OR REPLACE FUNCTION update_invoice_paid_status()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Devir faturaları: gerçek tahsilat yok, banka hareketi yok -> her zaman sent
  IF NEW.invoice_number LIKE 'DEV-%' OR NEW.invoice_number LIKE 'IADE-DEV-%' THEN
    IF NEW.status = 'paid' THEN
      NEW.status := 'sent';
      NEW.paid_amount := 0;
      NEW.remaining_amount := COALESCE(NEW.amount, NEW.total, 0);
      NEW.payment_date := NULL;
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.paid_amount >= COALESCE(NEW.total, NEW.amount, 0) 
     AND COALESCE(NEW.total, NEW.amount, 0) > 0
     AND NEW.status NOT IN ('paid', 'cancelled') THEN
    NEW.status := 'paid';
  END IF;
  
  IF NEW.paid_amount < COALESCE(NEW.total, NEW.amount, 0) AND NEW.status = 'paid' THEN
    IF NEW.due_date < CURRENT_DATE THEN
      NEW.status := 'overdue';
    ELSE
      NEW.status := 'sent';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2) Mevcut ödenmiş devir faturalarını düzelt
UPDATE invoices
SET
  status = 'sent',
  paid_amount = 0,
  remaining_amount = COALESCE(amount, total, 0),
  payment_date = NULL
WHERE (invoice_number LIKE 'DEV-%' OR invoice_number LIKE 'IADE-DEV-%')
  AND status = 'paid';

-- 3) Cari bakiyelerini ve total_revenue'yi devir faturalarından güncelle (bir kez çalıştırın)
UPDATE customers c
SET
  balance = COALESCE(dev.saldo, 0),
  total_revenue = GREATEST(0, COALESCE(c.total_revenue, 0) + COALESCE(dev.rev_delta, 0))
FROM (
  SELECT customer_id,
    SUM(CASE WHEN i.invoice_number LIKE 'IADE-DEV-%' THEN -COALESCE(i.amount, i.total, 0)
             ELSE COALESCE(i.amount, i.total, 0) END) AS saldo,
    SUM(CASE WHEN i.invoice_number LIKE 'IADE-DEV-%' THEN -COALESCE(i.amount, i.total, 0)
             ELSE COALESCE(i.amount, i.total, 0) END) AS rev_delta
  FROM invoices i
  WHERE i.invoice_number LIKE 'DEV-%' OR i.invoice_number LIKE 'IADE-DEV-%'
  GROUP BY customer_id
) dev
WHERE c.id = dev.customer_id;
