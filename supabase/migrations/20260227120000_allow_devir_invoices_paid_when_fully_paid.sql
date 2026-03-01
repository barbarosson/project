-- Devir faturaları (DEV-*, IADE-DEV-*) için: Kullanıcı ödeme girdiğinde (paid_amount >= total)
-- fatura ödendiye geçebilsin. Sadece tam ödeme yokken status=paid yapılırsa eski davranış (sent'e çek).
-- update_invoice_paid_status trigger'ı güncelleniyor.

CREATE OR REPLACE FUNCTION update_invoice_paid_status()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  inv_total numeric;
BEGIN
  inv_total := COALESCE(NEW.total, NEW.amount, 0);

  -- Devir faturaları: Tam ödeme yapıldıysa (paid_amount >= total) paid kalabilsin;
  -- aksi halde status=paid gelirse sent'e çek (otomatik/yanlış paid engelleme).
  IF NEW.invoice_number LIKE 'DEV-%' OR NEW.invoice_number LIKE 'IADE-DEV-%' THEN
    IF NEW.status = 'paid' AND (inv_total <= 0 OR NEW.paid_amount < inv_total) THEN
      NEW.status := 'sent';
      NEW.paid_amount := 0;
      NEW.remaining_amount := inv_total;
      NEW.payment_date := NULL;
    END IF;
    RETURN NEW;
  END IF;

  -- If paid_amount >= total and status is not already 'paid' or 'cancelled'
  IF NEW.paid_amount >= inv_total
     AND inv_total > 0
     AND NEW.status NOT IN ('paid', 'cancelled') THEN
    NEW.status := 'paid';
  END IF;

  -- If paid_amount < total and status is 'paid', revert to 'sent' or 'overdue'
  IF NEW.paid_amount < inv_total AND NEW.status = 'paid' THEN
    IF NEW.due_date < CURRENT_DATE THEN
      NEW.status := 'overdue';
    ELSE
      NEW.status := 'sent';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
