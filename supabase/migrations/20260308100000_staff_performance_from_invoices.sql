-- Personel performans skorunu, o personele bağlı satış faturalarından (son 12 ay, ödenen) günceller.
-- Satış faturaları girişinde staff_id seçildiğinde performansa yansır.

CREATE OR REPLACE FUNCTION public.update_staff_performance_from_invoices(p_staff_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_paid numeric;
  v_score numeric;
BEGIN
  IF p_staff_id IS NULL THEN
    RETURN;
  END IF;

  -- Son 12 ayda bu personele atanmış ve ödenmiş satış faturalarının toplam tutarı (satış tipi, iade hariç)
  SELECT COALESCE(SUM(i.paid_amount), 0)
  INTO v_total_paid
  FROM invoices i
  WHERE i.staff_id = p_staff_id
    AND i.status = 'paid'
    AND i.invoice_type = 'sale'
    AND i.issue_date >= (CURRENT_DATE - interval '12 months');

  -- Skor: her 5000 birim = 10 puan, max 100 (örn. 50.000 = 100)
  v_score := LEAST(100, GREATEST(0, ROUND((v_total_paid / 5000.0) * 10)::numeric));

  UPDATE staff
  SET performance_score = v_score,
      updated_at = COALESCE(updated_at, now())
  WHERE id = p_staff_id;
END;
$$;

-- Fatura eklendi/güncellendi/silindiğinde ilgili personelin performansını güncelle
CREATE OR REPLACE FUNCTION public.trigger_update_staff_performance_on_invoice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.staff_id IS NOT NULL AND (NEW.invoice_type = 'sale' OR NEW.invoice_type IS NULL) THEN
      PERFORM update_staff_performance_from_invoices(NEW.staff_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.staff_id IS DISTINCT FROM NEW.staff_id THEN
      IF OLD.staff_id IS NOT NULL THEN
        PERFORM update_staff_performance_from_invoices(OLD.staff_id);
      END IF;
      IF NEW.staff_id IS NOT NULL AND (NEW.invoice_type = 'sale' OR NEW.invoice_type IS NULL) THEN
        PERFORM update_staff_performance_from_invoices(NEW.staff_id);
      END IF;
    ELSIF NEW.staff_id IS NOT NULL AND (NEW.invoice_type = 'sale' OR NEW.invoice_type IS NULL)
      AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.paid_amount IS DISTINCT FROM NEW.paid_amount) THEN
      PERFORM update_staff_performance_from_invoices(NEW.staff_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.staff_id IS NOT NULL THEN
      PERFORM update_staff_performance_from_invoices(OLD.staff_id);
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_invoice_staff_performance ON public.invoices;
CREATE TRIGGER trigger_invoice_staff_performance
  AFTER INSERT OR UPDATE OR DELETE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_staff_performance_on_invoice();

COMMENT ON FUNCTION public.update_staff_performance_from_invoices(uuid) IS 'Personelin son 12 aydaki ödenmiş satış faturalarına göre performance_score günceller.';
