-- Masrafı bir cariye bağlamak ve cari bakiyesini güncellemek için customer_id ekle.

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_customer_id ON expenses(customer_id);

COMMENT ON COLUMN expenses.customer_id IS 'Cariye yansıyacak masraflar için müşteri/cari (bakiye artar)';

-- Cari bakiyesini faturalar + cariye bağlı masraflar olarak güncelle (customer_id olan masraflar bakiyeye eklenir)
UPDATE customers c
SET balance = COALESCE((
  SELECT SUM(COALESCE(i.remaining_amount, COALESCE(i.total, i.amount, 0) - COALESCE(i.paid_amount, 0)))
  FROM invoices i
  WHERE i.customer_id = c.id AND i.status NOT IN ('draft', 'cancelled')
), 0) + COALESCE((
  SELECT SUM(e.amount)
  FROM expenses e
  WHERE e.customer_id = c.id
), 0);
