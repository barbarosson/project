-- Alış faturaları: TEST123 ve TEST321, tenant 7017de59-79a5-42a4-a618-18a63e664d6a için.
-- Supabase SQL Editor'da çalıştırın.

SELECT
  pi.tenant_id,
  pi.id AS purchase_invoice_id,
  pi.invoice_number,
  pi.invoice_date,
  pi.due_date,
  pi.subtotal,
  pi.tax_amount,
  pi.total_amount,
  pi.status,
  pi.created_at,
  c.company_title AS supplier_company,
  c.name AS supplier_name,
  c.tax_number AS supplier_tax_number
FROM purchase_invoices pi
LEFT JOIN customers c ON c.id = pi.supplier_id AND c.tenant_id = pi.tenant_id
WHERE pi.tenant_id = '7017de59-79a5-42a4-a618-18a63e664d6a'
  AND pi.invoice_number IN ('TEST123', 'TEST321')
ORDER BY pi.invoice_number;
