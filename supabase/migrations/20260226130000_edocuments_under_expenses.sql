/*
  # EBelge İşlemleri menüsünü Alış Faturalarının hemen altına taşı

  Bu blok 3–7 arası sırayı netleştirir; önceki migration’lar çalışmamış olsa da doğru sıra oluşur.
  Son sıra: Satış Faturaları (3) -> Alış Faturaları (4) -> EBelge (5) -> Siparişler (6) -> Satınalma (7)
*/

UPDATE navigation_menus SET order_index = 3 WHERE slug = '/invoices';
UPDATE navigation_menus SET order_index = 4 WHERE slug = '/expenses';
UPDATE navigation_menus SET order_index = 5 WHERE slug = '/edocuments';
UPDATE navigation_menus SET order_index = 6 WHERE slug = '/orders';
UPDATE navigation_menus SET order_index = 7 WHERE slug = '/procurement';
