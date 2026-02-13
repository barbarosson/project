/*
  # Navigation Menus İngilizce Çevirilerini Düzelt

  1. Güncelleme
    - Tüm menü öğeleri için doğru İngilizce çeviriler ekle
*/

-- Dashboard
UPDATE navigation_menus SET label_en = 'Dashboard' WHERE slug = '/dashboard';

-- Cariler
UPDATE navigation_menus SET label_en = 'Customers & Suppliers' WHERE slug = '/customers';

-- Satış Faturaları
UPDATE navigation_menus SET label_en = 'Sales Invoices' WHERE slug = '/invoices';

-- Siparişler
UPDATE navigation_menus SET label_en = 'Orders' WHERE slug = '/orders';

-- Alış Faturaları ve Masraflar
UPDATE navigation_menus SET label_en = 'Purchase Invoices & Expenses' WHERE slug = '/expenses';

-- Satınalma İşlemleri
UPDATE navigation_menus SET label_en = 'Procurement' WHERE slug = '/procurement';

-- EBelge İşlemleri
UPDATE navigation_menus SET label_en = 'E-Document Operations' WHERE slug = '/edocuments';

-- Ürün ve Hizmetler (inventory için 2 farklı label var, ikisini de güncelle)
UPDATE navigation_menus SET label_en = 'Products & Services' WHERE slug = '/inventory' AND label = 'Ürün ve Hizmetler';
UPDATE navigation_menus SET label_en = 'Inventory Operations' WHERE slug = '/inventory' AND label = 'Envanter İşlemleri';

-- Pazaryeri Entegrasyonları
UPDATE navigation_menus SET label_en = 'Marketplace Integrations' WHERE slug = '/marketplace';

-- Banka ve Kasalar
UPDATE navigation_menus SET label_en = 'Banks & Cash' WHERE slug = '/finance/accounts';

-- Tahsilat ve Ödeme İşlemleri
UPDATE navigation_menus SET label_en = 'Collection & Payment Transactions' WHERE slug = '/finance/transactions';

-- İnsan Kaynakları
UPDATE navigation_menus SET label_en = 'Human Resources' WHERE slug = '/hr-ai';

-- Depolama
UPDATE navigation_menus SET label_en = 'Warehouses' WHERE slug = '/warehouses';

-- Şubeler
UPDATE navigation_menus SET label_en = 'Branches' WHERE slug = '/branches';

-- Projeler
UPDATE navigation_menus SET label_en = 'Projects' WHERE slug = '/projects';

-- Üretim
UPDATE navigation_menus SET label_en = 'Production' WHERE slug = '/production';

-- CRM
UPDATE navigation_menus SET label_en = 'CRM' WHERE slug = '/crm';

-- Kampanyalar
UPDATE navigation_menus SET label_en = 'Campaigns' WHERE slug = '/campaigns';

-- Teklif Yönetimi
UPDATE navigation_menus SET label_en = 'Proposal Management' WHERE slug = '/proposals';

-- Finans Robotu
UPDATE navigation_menus SET label_en = 'Finance Robot' WHERE slug = '/finance-robot';

-- Yapay Zeka Modülleri
UPDATE navigation_menus SET label_en = 'AI Modules' WHERE slug LIKE '/ai-%';
UPDATE navigation_menus SET label_en = 'AI Insights' WHERE slug = '/ai-insights';
UPDATE navigation_menus SET label_en = 'AI Production Advisor' WHERE slug = '/ai-production-advisor';
UPDATE navigation_menus SET label_en = 'AI Cash Flow' WHERE slug = '/ai-cash-flow';
UPDATE navigation_menus SET label_en = 'Accounting AI' WHERE slug = '/accounting-ai';

-- Executive Assistant
UPDATE navigation_menus SET label_en = 'Executive Assistant' WHERE slug = '/executive-assistant';

-- Trend Agent
UPDATE navigation_menus SET label_en = 'Trend Agent' WHERE slug = '/trend-agent';

-- E-İnvoice Center
UPDATE navigation_menus SET label_en = 'E-Invoice Center' WHERE slug = '/einvoice-center';

-- Ayarlar
UPDATE navigation_menus SET label_en = 'Settings' WHERE slug = '/settings';

-- Yardım
UPDATE navigation_menus SET label_en = 'Help' WHERE slug = '/help';

-- Destek
UPDATE navigation_menus SET label_en = 'Support' WHERE slug = '/support';

-- Maliyet Muhasebesi
UPDATE navigation_menus SET label_en = 'Cost Accounting' WHERE slug = '/cost';

-- Kalite Kontrol
UPDATE navigation_menus SET label_en = 'Quality Control' WHERE slug = '/quality';

-- Bakım Yönetimi
UPDATE navigation_menus SET label_en = 'Maintenance Management' WHERE slug = '/maintenance';
