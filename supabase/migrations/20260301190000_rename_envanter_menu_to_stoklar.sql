-- Rename "Envanter İşlemleri" menu to "Stoklar" and point to /stocks (stock from purchase invoices)
-- Ürün ve Hizmetler stays as /inventory; Envanter İşlemleri becomes Stoklar -> /stocks

UPDATE navigation_menus
SET
  label = 'Stoklar',
  label_tr = 'Stoklar',
  label_en = 'Stocks',
  slug = '/stocks'
WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
