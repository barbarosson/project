-- Allow unit_price to store full precision (e.g. 45.83333333) for e-invoice imports.
-- Previously numeric(12,2) truncated to 2 decimals.
ALTER TABLE purchase_invoice_line_items
  ALTER COLUMN unit_price TYPE numeric(15, 8);
