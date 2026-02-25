/*
  # Nakit Yönetimi ana menü + Banka ve Kasalar / Tahsilat ve Ödeme alt menü

  - Yeni ana menü: "Nakit Yönetimi" (Cash Management), EBelge'nin altına (order_index 6)
  - "Banka ve Kasalar" ve "Tahsilat ve Ödeme İşlemleri" bu menünün altına taşınır
  - Diğer ana menü öğeleri (order_index >= 6) bir sıra kaydırılır
*/

-- 1. Sıra açmak için: order_index >= 6 olan ana menüleri bir artır
UPDATE navigation_menus
SET order_index = order_index + 1
WHERE parent_id IS NULL AND order_index >= 6;

-- 2. Yeni ana menü: Nakit Yönetimi (EBelge'nin hemen altı, 6)
INSERT INTO navigation_menus (id, label, slug, icon, parent_id, order_index, is_visible, label_tr, label_en)
VALUES (
  'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1',
  'Nakit Yönetimi',
  '#',
  'Wallet',
  NULL,
  6,
  true,
  'Nakit Yönetimi',
  'Cash Management'
);

-- 3. Banka ve Kasalar -> Nakit Yönetimi alt menüsü (ilk sıra)
UPDATE navigation_menus
SET parent_id = 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', order_index = 0
WHERE slug = '/finance/accounts';

-- 4. Tahsilat ve Ödeme İşlemleri -> Nakit Yönetimi alt menüsü (ikinci sıra)
UPDATE navigation_menus
SET parent_id = 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', order_index = 1
WHERE slug = '/finance/transactions';
