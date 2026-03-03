-- Menüde "Stoklar" yerine "Envanter" gösterilsin (TR: Envanter, EN: Inventory)
-- /stocks sayfasına giden menü öğesinin etiketini güncelle

UPDATE navigation_menus
SET
  label = 'Envanter',
  label_tr = 'Envanter',
  label_en = 'Inventory'
WHERE slug = '/stocks';
