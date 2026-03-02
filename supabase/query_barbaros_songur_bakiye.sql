-- BARBAROS SONGUR için olması gereken bakiyeyi tek satırda döndürür.
-- Supabase Dashboard > SQL Editor'da çalıştırın; "olmasi_gereken_bakiye" sütunundaki rakam cevaptır.

SELECT
  c.company_title,
  c.name,
  c.balance AS kayitli_bakiye,
  COALESCE(inv.toplam, 0) AS fatura_kalan,
  COALESCE(exp.toplam, 0) AS masraf_toplam,
  COALESCE(inv.toplam, 0) + COALESCE(exp.toplam, 0) AS olmasi_gereken_bakiye
FROM customers c
LEFT JOIN (
  SELECT customer_id,
    SUM(COALESCE(remaining_amount, COALESCE(total, amount, 0) - COALESCE(paid_amount, 0))) AS toplam
  FROM invoices WHERE status <> 'cancelled'
  GROUP BY customer_id
) inv ON inv.customer_id = c.id
LEFT JOIN (
  SELECT customer_id, SUM(amount) AS toplam
  FROM expenses WHERE customer_id IS NOT NULL
  GROUP BY customer_id
) exp ON exp.customer_id = c.id
WHERE c.company_title ILIKE '%Barbaros%' OR c.name ILIKE '%Barbaros%'
   OR c.company_title ILIKE '%Songur%' OR c.name ILIKE '%Songur%';
