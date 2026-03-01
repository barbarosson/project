-- Tüm hesap bakiyelerini açılış bakiyesi + kalan işlemlere göre yeniden hesapla.
-- Geçmişte silinen işlemler yüzünden yanlış kalan bakiyeleri düzeltir.

UPDATE accounts a
SET
  current_balance = a.opening_balance + COALESCE((
    SELECT SUM(CASE WHEN t.transaction_type = 'income' THEN t.amount ELSE -t.amount END)
    FROM transactions t
    WHERE t.account_id = a.id
  ), 0),
  updated_at = now();
