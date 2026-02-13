/*
  # Update Navigation Menus with New Modules

  1. Purpose
    - Add all missing navigation menu items
    - Update order to match current application structure
    
  2. Changes
    - Delete old menus and insert new complete list
*/

-- Clear existing menus
TRUNCATE TABLE navigation_menus CASCADE;

-- Insert all current menu items in correct order
INSERT INTO navigation_menus (label, slug, order_index, is_visible, icon, parent_id) VALUES
  ('Dashboard', '/dashboard', 1, true, 'LayoutDashboard', NULL),
  ('Customers', '/customers', 2, true, 'Users', NULL),
  ('Inventory', '/inventory', 3, true, 'Package', NULL),
  ('Procurement', '/procurement', 4, true, 'Truck', NULL),
  ('Warehouses', '/warehouses', 5, true, 'Warehouse', NULL),
  ('Branches', '/branches', 6, true, 'Building2', NULL),
  ('Invoices', '/invoices', 7, true, 'FileText', NULL),
  ('Orders', '/orders', 8, true, 'ShoppingCart', NULL),
  ('Projects', '/projects', 9, true, 'FolderKanban', NULL),
  ('Production', '/production', 10, true, 'Factory', NULL),
  ('Proposals', '/proposals', 11, true, 'FileText', NULL),
  ('Expenses', '/expenses', 12, true, 'Receipt', NULL),
  ('Finance', '/finance', 13, true, 'Wallet', NULL),
  ('Campaigns', '/campaigns', 14, true, 'Megaphone', NULL),
  ('AI Insights', '/ai-insights', 15, true, 'Sparkles', NULL),
  ('Finance Robot', '/finance-robot', 16, true, 'Bot', NULL),
  ('Accounting AI', '/accounting-ai', 17, true, 'Scale', NULL),
  ('Executive Assistant', '/executive-assistant', 18, true, 'BriefcaseBusiness', NULL),
  ('Trend Agent', '/trend-agent', 19, true, 'TrendingUp', NULL),
  ('Marketplace', '/marketplace', 20, true, 'Store', NULL),
  ('eDocuments', '/edocuments', 21, true, 'FileCheck2', NULL),
  ('Support', '/support', 22, true, 'HelpCircle', NULL),
  ('Settings', '/settings', 23, true, 'Settings', NULL);

-- Add Finance sub-menu items
DO $$
DECLARE
  finance_menu_id uuid;
BEGIN
  SELECT id INTO finance_menu_id FROM navigation_menus WHERE slug = '/finance' LIMIT 1;
  
  IF finance_menu_id IS NOT NULL THEN
    INSERT INTO navigation_menus (label, slug, order_index, is_visible, icon, parent_id) VALUES
      ('Transactions', '/finance/transactions', 1, true, 'ArrowRightLeft', finance_menu_id),
      ('Accounts', '/finance/accounts', 2, true, 'CreditCard', finance_menu_id);
  END IF;
END $$;
