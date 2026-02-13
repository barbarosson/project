/*
  # Add Cariler submenu under Cariler parent

  1. Changes
    - Add "Cariler" submenu item pointing to /customers under the Cariler parent menu
    - This ensures both "Cariler" and "Mutabakat" appear as sub-items
    
  2. Notes
    - Parent menu (Cariler) id: 22222222-2222-2222-2222-222222222222
    - Cariler submenu order_index: 0 (first)
    - Mutabakat submenu order_index: 1 (second)
*/

INSERT INTO navigation_menus (
  id,
  label,
  label_en,
  label_tr,
  description_en,
  description_tr,
  slug,
  icon,
  parent_id,
  order_index,
  is_visible
) VALUES (
  'a2222222-2222-2222-2222-222222222222',
  'Customers',
  'Customers',
  'Cariler',
  'Customer management',
  'Cari yönetimi',
  '/customers',
  'Users',
  '22222222-2222-2222-2222-222222222222',
  0,
  true
)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  label_tr = EXCLUDED.label_tr,
  slug = EXCLUDED.slug,
  icon = EXCLUDED.icon,
  parent_id = EXCLUDED.parent_id,
  order_index = EXCLUDED.order_index,
  is_visible = EXCLUDED.is_visible;

-- Update parent menu slug to prevent direct navigation (it's now a group)
UPDATE navigation_menus 
SET slug = '#customers'
WHERE id = '22222222-2222-2222-2222-222222222222';