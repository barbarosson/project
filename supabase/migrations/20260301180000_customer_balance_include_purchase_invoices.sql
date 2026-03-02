-- Cari bakiyesine alış faturaları (tedarikçiye borç) dahil et.
-- Bakiye = satış faturaları kalan + cariye masraf - alış faturaları (accepted/pending) toplamı.
-- Negatif bakiye = tedarikçiye borç (3.500 gibi).

UPDATE customers c
SET balance = COALESCE((
  SELECT SUM(COALESCE(i.remaining_amount, COALESCE(i.total, i.amount, 0) - COALESCE(i.paid_amount, 0)))
  FROM invoices i
  WHERE i.customer_id = c.id AND i.status <> 'cancelled'
), 0) + COALESCE((
  SELECT SUM(e.amount)
  FROM expenses e
  WHERE e.customer_id = c.id
), 0) - COALESCE((
  SELECT SUM(pi.total_amount)
  FROM purchase_invoices pi
  WHERE pi.supplier_id = c.id AND pi.status IN ('accepted', 'pending')
), 0);
