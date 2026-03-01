-- Fatura ödenen tutar ve durumunu gerçek tahsilat işlemlerine göre yeniden hesapla.
-- INV-2026-00012 gibi ödemesi olmayan ama "ödendi" görünen faturaları düzeltir.

WITH paid_from_transactions AS (
  SELECT
    t.reference_id AS invoice_id,
    COALESCE(SUM(t.amount), 0) AS actual_paid
  FROM transactions t
  WHERE t.reference_type = 'invoice'
    AND t.reference_id IS NOT NULL
    AND t.transaction_type = 'income'
  GROUP BY t.reference_id
)
UPDATE invoices i
SET
  paid_amount = COALESCE(p.actual_paid, 0),
  remaining_amount = GREATEST(0, COALESCE(i.total, i.amount, 0) - COALESCE(p.actual_paid, 0)),
  status = CASE
    WHEN COALESCE(i.total, i.amount, 0) <= 0 THEN i.status
    WHEN COALESCE(p.actual_paid, 0) >= COALESCE(i.total, i.amount, 0) THEN 'paid'
    WHEN i.due_date < CURRENT_DATE THEN 'overdue'
    ELSE 'sent'
  END,
  payment_date = CASE
    WHEN COALESCE(p.actual_paid, 0) >= COALESCE(i.total, i.amount, 0) THEN (
      SELECT MAX(t.transaction_date)
      FROM transactions t
      WHERE t.reference_type = 'invoice'
        AND t.reference_id = i.id
        AND t.transaction_type = 'income'
    )
    ELSE NULL
  END,
  updated_at = now()
FROM paid_from_transactions p
WHERE p.invoice_id = i.id;

-- Tahsilatı hiç olmayan faturaları da sıfırla (transactions'ta kaydı yok)
UPDATE invoices i
SET
  paid_amount = 0,
  remaining_amount = COALESCE(i.total, i.amount, 0),
  status = CASE
    WHEN COALESCE(i.total, i.amount, 0) <= 0 THEN i.status
    WHEN i.status = 'cancelled' THEN i.status
    WHEN i.due_date < CURRENT_DATE THEN 'overdue'
    ELSE 'sent'
  END,
  payment_date = NULL,
  updated_at = now()
WHERE NOT EXISTS (
  SELECT 1
  FROM transactions t
  WHERE t.reference_type = 'invoice'
    AND t.reference_id = i.id
    AND t.transaction_type = 'income'
)
AND (i.paid_amount IS NULL OR i.paid_amount <> 0 OR i.status = 'paid');
