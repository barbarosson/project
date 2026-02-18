-- Devir faturası (DEV-*, IADE-DEV-*) eklendiğinde cari bakiyesini ve total_revenue'yu güncelle.
-- RLS'tan bağımsız çalışır (SECURITY DEFINER); tek kaynak = fatura.

CREATE OR REPLACE FUNCTION sync_customer_balance_on_devir_invoice()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  amt numeric;
  is_refund boolean;
  bal_delta numeric;
  rev_delta numeric;
BEGIN
  IF NEW.invoice_number NOT LIKE 'DEV-%' AND NEW.invoice_number NOT LIKE 'IADE-DEV-%' THEN
    RETURN NEW;
  END IF;

  amt := COALESCE(NEW.total, NEW.amount, 0);
  IF amt <= 0 THEN
    RETURN NEW;
  END IF;

  is_refund := (NEW.invoice_number LIKE 'IADE-DEV-%');
  IF is_refund THEN
    bal_delta := -amt;
    rev_delta := -amt;
  ELSE
    bal_delta := amt;
    rev_delta := amt;
  END IF;

  UPDATE customers
  SET
    balance = COALESCE(balance, 0) + bal_delta,
    total_revenue = GREATEST(0, COALESCE(total_revenue, 0) + rev_delta)
  WHERE id = NEW.customer_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_customer_balance_on_devir_invoice ON invoices;
CREATE TRIGGER trigger_sync_customer_balance_on_devir_invoice
  AFTER INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION sync_customer_balance_on_devir_invoice();
