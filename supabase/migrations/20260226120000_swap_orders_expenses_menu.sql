/*
  # Menü sırası: Siparişler ile Alış Faturaları yer değiştirir

  - Siparişler (/orders): order_index 4 -> 5
  - Alış Faturaları ve Masraflar (/expenses): order_index 5 -> 4
  Böylece sidebar'da "Alış Faturaları ve Masraflar" önce, "Siparişler" sonra görünür.
*/

UPDATE navigation_menus SET order_index = 5 WHERE slug = '/orders';
UPDATE navigation_menus SET order_index = 4 WHERE slug = '/expenses';
