-- Remove /edocuments menu and submenus; only /einvoice-center remains for e-belge.
-- 1) Point the parent "E-Belge İşlemleri" to einvoice-center first (so it is not deleted in step 2)
UPDATE navigation_menus
SET slug = '/einvoice-center', label = 'E-Fatura Merkezi', label_tr = 'E-Fatura Merkezi', label_en = 'E-Invoice Center'
WHERE id = '77777777-7777-7777-7777-777777777777';

-- 2) Delete the "E-Belgeler" submenu item that pointed to /edocuments
DELETE FROM navigation_menus WHERE slug = '/edocuments';

-- 3) Remove duplicate child "E-Fatura Merkezi" so only the parent links to /einvoice-center
DELETE FROM navigation_menus WHERE id = '89898989-8989-8989-8989-898989898989';
