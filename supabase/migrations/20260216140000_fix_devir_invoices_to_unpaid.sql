-- Devir faturaları (DEV-*, IADE-DEV-*) ödenmiş olarak oluşturulmuştu;
-- Gerçek banka hareketi olmadığı için hepsini sent (ödenmemiş) yap
-- Affects: DEV-1771336063089 and all other devir invoices

UPDATE invoices
SET
  status = 'sent',
  paid_amount = 0,
  remaining_amount = COALESCE(amount, total, 0),
  payment_date = NULL
WHERE (invoice_number LIKE 'DEV-%' OR invoice_number LIKE 'IADE-DEV-%')
  AND status = 'paid';
