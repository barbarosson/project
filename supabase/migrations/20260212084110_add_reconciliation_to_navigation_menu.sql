/*
  # Add Reconciliation to Navigation Menu

  1. New Menu Items
    - Add Mutabakat (Reconciliation) as a submenu under Customers
    
  2. Changes
    - Insert new navigation menu item for reconciliation
*/

-- Add Reconciliation submenu under Customers
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
  'a1111111-1111-1111-1111-111111111111',
  'Reconciliation',
  'Reconciliation',
  'Mutabakat',
  'Customer balance reconciliation',
  'Cari bakiye mutabakatı',
  '/reconciliation',
  'FileCheck',
  '22222222-2222-2222-2222-222222222222',
  1,
  true
)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  label_tr = EXCLUDED.label_tr,
  description_en = EXCLUDED.description_en,
  description_tr = EXCLUDED.description_tr,
  slug = EXCLUDED.slug,
  icon = EXCLUDED.icon,
  parent_id = EXCLUDED.parent_id,
  order_index = EXCLUDED.order_index,
  is_visible = EXCLUDED.is_visible;