-- Cari bakiyesini faturalar (draft dahil, iptal hariç) + cariye bağlı masraflara göre yeniden hesapla.
-- TEST123 gibi yeni eklenen faturaların bakiyeye yansımaması sorununu giderir.

UPDATE customers c
SET balance = COALESCE((
  SELECT SUM(COALESCE(i.remaining_amount, COALESCE(i.total, i.amount, 0) - COALESCE(i.paid_amount, 0)))
  FROM invoices i
  WHERE i.customer_id = c.id AND i.status <> 'cancelled'
), 0) + COALESCE((
  SELECT SUM(e.amount)
  FROM expenses e
  WHERE e.customer_id = c.id
), 0);
