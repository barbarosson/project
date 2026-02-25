/*
  # Pazaryeri Entegrasyonlarını Nakit Yönetiminden hemen sonraya taşı

  Sıra: Nakit Yönetimi (6) -> Pazaryeri Entegrasyonları (7) -> Siparişler (8) -> ...
*/

-- 1. Nakit Yönetimi (6) ile Pazaryeri'nin mevcut sırası arasındaki ana menüleri bir kaydır
UPDATE navigation_menus
SET order_index = order_index + 1
WHERE parent_id IS NULL
  AND order_index >= 7
  AND order_index < (SELECT order_index FROM navigation_menus WHERE slug = '/marketplace' LIMIT 1);

-- 2. Pazaryeri Entegrasyonlarını 7. sıraya al
UPDATE navigation_menus
SET order_index = 7
WHERE slug = '/marketplace';
