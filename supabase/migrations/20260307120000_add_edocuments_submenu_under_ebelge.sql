-- Add "E-Belgeler" (/edocuments) as submenu under "E-Belge İşlemleri" so both /edocuments and /einvoice-center are visible in the menu.
-- Parent id for E-Belge İşlemleri: 77777777-7777-7777-7777-777777777777
INSERT INTO navigation_menus (id, label, slug, icon, parent_id, order_index, is_visible, label_tr, label_en)
VALUES
  ('79797979-7979-7979-7979-797979797979', 'E-Belgeler', '/edocuments', 'FileSpreadsheet', '77777777-7777-7777-7777-777777777777', 0, true, 'E-Belgeler', 'E-Documents')
ON CONFLICT (id) DO NOTHING;

-- Ensure E-Fatura Merkezi stays after E-Belgeler (order_index 1)
UPDATE navigation_menus SET order_index = 1 WHERE id = '89898989-8989-8989-8989-898989898989';
