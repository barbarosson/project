-- Devir bakiyesi artık sadece uygulama (createOpeningBalanceInvoice) tarafından güncelleniyor.
-- Çift güncellemeyi önlemek için bu trigger kaldırılıyor.

DROP TRIGGER IF EXISTS trigger_sync_customer_balance_on_devir_invoice ON invoices;
DROP FUNCTION IF EXISTS sync_customer_balance_on_devir_invoice();
