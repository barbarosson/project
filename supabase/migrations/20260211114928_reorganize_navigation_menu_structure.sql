/*
  # Reorganize Navigation Menu Structure

  1. Purpose
    - Reorganize menu order to match business requirements
    - Rename menu items with proper Turkish/English labels
    - Create AI Modules parent menu with submenus
    - Remove Finance menu
    - Add missing menu items

  2. Changes
    - Dashboard (1)
    - Cariler/Customers (2)
    - Satış Faturaları/Sales Invoices (3)
    - Siparişler/Orders (4)
    - Alış Faturaları ve Masraflar/Purchase Invoices & Expenses (5)
    - Satınalma İşlemleri/Procurement (6)
    - EBelge İşlemleri/E-Documents (7)
    - Ürün ve Hizmetler/Products & Services (8)
    - Pazaryeri Entegrasyonları/Marketplace (9)
    - Banka ve Kasalar/Banks & Cash (10)
    - Tahsilat ve Ödeme İşlemleri/Collections & Payments (11)
    - İnsan Kaynakları/Human Resources (12)
    - Depolama/Warehouses (13)
    - Envanter İşlemleri/Stock Operations (14)
    - Şubeler/Branches (15)
    - Proje/Projects (16)
    - Üretim/Production (17)
    - Maliyet/Cost (18)
    - Kalite/Quality (19)
    - Bakım/Maintenance (20)
    - Teklifler/Proposals (21)
    - Kampanyalar/Campaigns (23)
    - AI Modülleri/AI Modules (24) - parent menu
      - AI CFO (24.1)
      - AI Finance (24.2)
      - Executive Assistant (24.3)
      - Fiyat Takip Robotu/Price Tracking Robot (24.4)
      - AI Nakit Akış Robotu/AI Cash Flow Robot (24.5)
      - AI CRM Robotu/AI CRM Robot (24.6)
    - Destek/Support (25)
    - Settings (26)

  3. Security
    - No RLS changes needed
*/

-- First, delete all existing menus to start fresh
DELETE FROM navigation_menus;

-- Insert new menu structure
-- Level 1 - Main Menus
INSERT INTO navigation_menus (id, label, slug, icon, parent_id, order_index, is_visible) VALUES
-- 1. Dashboard
('11111111-1111-1111-1111-111111111111', 'Dashboard', '/dashboard', 'LayoutDashboard', NULL, 1, true),

-- 2. Cariler (Customers)
('22222222-2222-2222-2222-222222222222', 'Cariler', '/customers', 'Users', NULL, 2, true),

-- 3. Satış Faturaları (Sales Invoices)
('33333333-3333-3333-3333-333333333333', 'Satış Faturaları', '/invoices', 'FileText', NULL, 3, true),

-- 4. Siparişler (Orders)
('44444444-4444-4444-4444-444444444444', 'Siparişler', '/orders', 'ShoppingCart', NULL, 4, true),

-- 5. Alış Faturaları ve Masraflar (Purchase Invoices & Expenses)
('55555555-5555-5555-5555-555555555555', 'Alış Faturaları ve Masraflar', '/expenses', 'Receipt', NULL, 5, true),

-- 6. Satınalma İşlemleri (Procurement)
('66666666-6666-6666-6666-666666666666', 'Satınalma İşlemleri', '/procurement', 'Truck', NULL, 6, true),

-- 7. EBelge İşlemleri (E-Documents)
('77777777-7777-7777-7777-777777777777', 'EBelge İşlemleri', '/edocuments', 'FileSpreadsheet', NULL, 7, true),

-- 8. Ürün ve Hizmetler (Products & Services) - renamed from Inventory
('88888888-8888-8888-8888-888888888888', 'Ürün ve Hizmetler', '/inventory', 'Package', NULL, 8, true),

-- 9. Pazaryeri Entegrasyonları (Marketplace)
('99999999-9999-9999-9999-999999999999', 'Pazaryeri Entegrasyonları', '/marketplace', 'Store', NULL, 9, true),

-- 10. Banka ve Kasalar (Banks & Cash) - renamed from Accounts
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Banka ve Kasalar', '/finance/accounts', 'Wallet', NULL, 10, true),

-- 11. Tahsilat ve Ödeme İşlemleri (Collections & Payments) - renamed from Transactions
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Tahsilat ve Ödeme İşlemleri', '/finance/transactions', 'ArrowRightLeft', NULL, 11, true),

-- 12. İnsan Kaynakları (Human Resources)
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'İnsan Kaynakları', '/hr-ai', 'Users', NULL, 12, true),

-- 13. Depolama (Warehouses)
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Depolama', '/warehouses', 'Warehouse', NULL, 13, true),

-- 14. Envanter İşlemleri (Stock Operations) - new menu
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Envanter İşlemleri', '/inventory', 'Package', NULL, 14, true),

-- 15. Şubeler (Branches)
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Şubeler', '/branches', 'Building2', NULL, 15, true),

-- 16. Proje (Projects)
('10101010-1010-1010-1010-101010101010', 'Proje', '/projects', 'FolderKanban', NULL, 16, true),

-- 17. Üretim (Production)
('20202020-2020-2020-2020-202020202020', 'Üretim', '/production', 'Factory', NULL, 17, true),

-- 18. Maliyet (Cost) - new menu
('30303030-3030-3030-3030-303030303030', 'Maliyet', '/cost', 'Scale', NULL, 18, true),

-- 19. Kalite (Quality) - new menu
('40404040-4040-4040-4040-404040404040', 'Kalite', '/quality', 'Shield', NULL, 19, true),

-- 20. Bakım (Maintenance) - new menu
('50505050-5050-5050-5050-505050505050', 'Bakım', '/maintenance', 'Activity', NULL, 20, true),

-- 21. Teklifler (Proposals)
('60606060-6060-6060-6060-606060606060', 'Teklifler', '/proposals', 'FileCheck2', NULL, 21, true),

-- 23. Kampanyalar (Campaigns)
('70707070-7070-7070-7070-707070707070', 'Kampanyalar', '/campaigns', 'Megaphone', NULL, 23, true),

-- 24. AI Modülleri (AI Modules) - Parent menu
('80808080-8080-8080-8080-808080808080', 'AI Modülleri', '#', 'Brain', NULL, 24, true),

-- 25. Destek (Support)
('90909090-9090-9090-9090-909090909090', 'Destek', '/support', 'LifeBuoy', NULL, 25, true),

-- 26. Ayarlar (Settings)
('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0', 'Ayarlar', '/settings', 'Settings', NULL, 26, true);

-- Level 2 - AI Modules Submenus
INSERT INTO navigation_menus (id, label, slug, icon, parent_id, order_index, is_visible) VALUES
-- 24.1 AI CFO (renamed from AI Insights)
('81818181-8181-8181-8181-818181818181', 'AI CFO', '/ai-insights', 'Brain', '80808080-8080-8080-8080-808080808080', 1, true),

-- 24.2 AI Finance (renamed from Finance Robot)
('82828282-8282-8282-8282-828282828282', 'AI Finance', '/finance-robot', 'Bot', '80808080-8080-8080-8080-808080808080', 2, true),

-- 24.3 Executive Assistant
('83838383-8383-8383-8383-838383838383', 'Executive Assistant', '/executive-assistant', 'BriefcaseBusiness', '80808080-8080-8080-8080-808080808080', 3, true),

-- 24.4 Fiyat Takip Robotu (Price Tracking Robot) - renamed from Trend Agent
('84848484-8484-8484-8484-848484848484', 'Fiyat Takip Robotu', '/trend-agent', 'TrendingUp', '80808080-8080-8080-8080-808080808080', 4, true),

-- 24.5 AI Nakit Akış Robotu (AI Cash Flow Robot)
('85858585-8585-8585-8585-858585858585', 'AI Nakit Akış Robotu', '/ai-cash-flow', 'Activity', '80808080-8080-8080-8080-808080808080', 5, true),

-- 24.6 AI CRM Robotu (AI CRM Robot) - renamed from CRM
('86868686-8686-8686-8686-868686868686', 'AI CRM Robotu', '/crm', 'MessageCircle', '80808080-8080-8080-8080-808080808080', 6, true);

-- Add EInvoice Center submenu under EBelge İşlemleri
INSERT INTO navigation_menus (id, label, slug, icon, parent_id, order_index, is_visible) VALUES
('87878787-8787-8787-8787-878787878787', 'E-Fatura Merkezi', '/einvoice-center', 'FileText', '77777777-7777-7777-7777-777777777777', 1, true);
