-- Masraf girişinde personel seçilebilmesi için staff_id alanı.
-- Personel masrafları ve avans ödemeleri bu alan ile ilişkilendirilir.

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS staff_id uuid REFERENCES staff(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_staff_id ON expenses(staff_id);

COMMENT ON COLUMN expenses.staff_id IS 'Personel masrafları ve avans ödemeleri için ilgili personel';
