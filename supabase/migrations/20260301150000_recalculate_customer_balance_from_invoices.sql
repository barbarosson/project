-- Cari bakiyesini faturalardaki kalan tutarlara göre yeniden hesapla.
-- BARBAROS SONGUR gibi ekranda yanlış bakiye görünen carileri düzeltir.
-- Bakiye = müşteriye ait faturaların (draft/cancelled hariç) remaining_amount toplamı.

UPDATE customers c
SET balance = COALESCE((
  SELECT SUM(
    COALESCE(i.remaining_amount, COALESCE(i.total, i.amount, 0) - COALESCE(i.paid_amount, 0))
  )
  FROM invoices i
  WHERE i.customer_id = c.id
    AND i.status NOT IN ('draft', 'cancelled')
), 0);
