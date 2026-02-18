-- Devir faturaları (DEV-*, IADE-DEV-*) asla otomatik paid olmamalı.
-- update_invoice_paid_status fonksiyonuna devir istisnası ekle.

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

  -- If paid_amount >= total and status is not already 'paid' or 'cancelled'
  IF NEW.paid_amount >= COALESCE(NEW.total, NEW.amount, 0) 
     AND COALESCE(NEW.total, NEW.amount, 0) > 0
     AND NEW.status NOT IN ('paid', 'cancelled') THEN
    NEW.status := 'paid';
  END IF;
  
  -- If paid_amount < total and status is 'paid', revert to 'sent' or 'overdue'
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
