-- AS Örnek Müşteri A.Ş. için: bakiye + ödenmemiş fatura toplamı
-- Supabase SQL Editor'da çalıştırın.

SELECT
  c.id,
  c.company_title,
  c.name,
  c.balance AS cari_bakiyesi,
  COALESCE(SUM(i.remaining_amount), 0) AS toplam_odenmemis_fatura,
  COUNT(i.id) FILTER (WHERE i.remaining_amount > 0) AS odenmemis_fatura_sayisi
FROM customers c
LEFT JOIN invoices i ON i.customer_id = c.id
  AND i.status NOT IN ('cancelled', 'paid')
  AND COALESCE(i.remaining_amount, i.amount, i.total, 0) > 0
WHERE c.company_title ILIKE '%Örnek Müşteri%'
   OR c.name ILIKE '%Örnek Müşteri%'
GROUP BY c.id, c.company_title, c.name, c.balance;
