-- Envanter menüsünü kaldır: /stocks menü öğesini gizle
UPDATE navigation_menus
SET is_visible = false
WHERE slug = '/stocks';
