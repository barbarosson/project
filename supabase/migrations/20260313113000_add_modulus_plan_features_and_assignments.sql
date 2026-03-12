-- Add Modulus pricing features & plan assignments
-- This migration seeds:
-- - plan_features: feature definitions for modules, AI, reporting and limits
-- - plan_feature_assignments: which plan has which feature and with what limit
--
-- Plans are identified by subscription_plans.plan_code:
--   FREE, KUCUK, ORTA, BUYUK, ENTERPRISE

---------------------------
-- 1) plan_features seeds
---------------------------

-- Helper: insert a feature only if feature_key doesn't exist yet
DO $$
BEGIN
  -- CORE
  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'core_dashboard') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'core_dashboard',
      'Kontrol Paneli',
      'Dashboard',
      'İşletmenizin anlık özetini tek ekrandan görün.',
      'See a real-time overview of your business on a single screen.',
      'core',
      10,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'core_multi_language') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'core_multi_language',
      'Çok Dilli Arayüz (TR/EN)',
      'Multi-language UI (TR/EN)',
      'Türkçe ve İngilizce arayüz arasında tek tıkla geçiş yapın.',
      'Switch between Turkish and English interfaces with one click.',
      'core',
      20,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'core_multi_currency') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'core_multi_currency',
      'Çoklu Para Birimi',
      'Multi-currency',
      'TRY, USD, EUR gibi para birimleriyle çalışın.',
      'Work with TRY, USD, EUR and more.',
      'core',
      30,
      false
    );
  END IF;

  -- SALES
  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'sales_invoices_basic') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'sales_invoices_basic',
      'Temel Satış Faturaları',
      'Basic Sales Invoices',
      'Alış, satış ve iade faturalarını kolayca oluşturun.',
      'Create basic sales and return invoices easily.',
      'sales',
      10,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'sales_invoices_advanced_types') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'sales_invoices_advanced_types',
      'Gelişmiş Fatura Tipleri',
      'Advanced Invoice Types',
      'Proforma, perakende ve konaklama vergisi faturaları oluşturun.',
      'Create proforma, retail and accommodation tax invoices.',
      'sales',
      20,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'sales_einvoice_integration') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'sales_einvoice_integration',
      'E-Fatura / E-Arşiv Entegrasyonu',
      'E-Invoice / E-Archive Integration',
      'NES / GİB entegrasyonu ile faturalarınızı dijital olarak gönderin.',
      'Send your invoices digitally via NES / GIB integration.',
      'sales',
      30,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'sales_bulk_invoicing') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'sales_bulk_invoicing',
      'Toplu Fatura Oluşturma',
      'Bulk Invoicing',
      'Onlarca faturayı tek seferde oluşturun ve gönderin.',
      'Create and send dozens of invoices in one go.',
      'sales',
      40,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'sales_offer_management') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'sales_offer_management',
      'Teklif Yönetimi',
      'Offer Management',
      'Teklif ve proforma süreçlerinizi yönetin.',
      'Manage your offers and quotations.',
      'sales',
      50,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'sales_campaigns') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'sales_campaigns',
      'Kampanya Yönetimi',
      'Campaign Management',
      'İndirim ve kampanyalarınızı tanımlayın, faturaya yansıtın.',
      'Define discounts and campaigns and apply them to invoices.',
      'sales',
      60,
      false
    );
  END IF;

  -- EXPENSES
  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'expenses_purchase_invoices') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'expenses_purchase_invoices',
      'Alış Faturaları Listesi',
      'Purchase Invoices List',
      'Tüm alış faturalarınızı tek listede görün ve yönetin.',
      'See and manage all purchase invoices in a single list.',
      'expenses',
      10,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'expenses_receipt_ocr') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'expenses_receipt_ocr',
      'Fiş OCR (Yapay Zeka)',
      'Receipt OCR (AI)',
      'Fişleri fotoğraf çekerek okutun, alanlar otomatik dolsun.',
      'Scan receipts with AI and auto-fill expense fields.',
      'expenses',
      20,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'expenses_auto_supplier_create') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'expenses_auto_supplier_create',
      'Otomatik Cari Oluşturma',
      'Auto Supplier Creation',
      'Gelen e-faturalardan otomatik tedarikçi kaydı oluşturun.',
      'Automatically create supplier records from incoming e-invoices.',
      'expenses',
      30,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'expenses_einvoice_import') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'expenses_einvoice_import',
      'E-Faturadan Gidere Aktarım',
      'Import to Expenses from E-Invoice',
      'E-fatura merkezindeki belgeleri tek tıkla giderlere aktarın.',
      'Import documents from e-invoice center into expenses with one click.',
      'expenses',
      40,
      false
    );
  END IF;

  -- E-INVOICE
  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'einvoice_center_incoming_outgoing') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'einvoice_center_incoming_outgoing',
      'E-Fatura Merkezi',
      'E-Invoice Center',
      'Gelen ve giden tüm e-dokümanları tek ekranda görün.',
      'See all incoming and outgoing e-documents in one hub.',
      'einvoice',
      10,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'einvoice_preview_before_import') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'einvoice_preview_before_import',
      'İçe Aktarmadan Önce Önizleme',
      'Preview Before Import',
      'Gelen faturayı içe aktarmadan önce detaylı önizleyin.',
      'Preview incoming invoices before importing them.',
      'einvoice',
      20,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'einvoice_status_tracking') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'einvoice_status_tracking',
      'Durum Takibi',
      'Status Tracking',
      'GİB durumlarını takip edin, hangi faturanın nerede olduğunu görün.',
      'Track GIB statuses and see where each invoice is in the process.',
      'einvoice',
      30,
      false
    );
  END IF;

  -- FINANCE
  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'finance_accounts') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'finance_accounts',
      'Finans Hesapları',
      'Finance Accounts',
      'Banka, kasa, POS gibi tüm hesaplarınızı yönetin.',
      'Manage all your bank, cash and POS accounts.',
      'finance',
      10,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'finance_transactions') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'finance_transactions',
      'Finans İşlemleri',
      'Finance Transactions',
      'Tahsilat ve ödemelerinizi kaydedin, nakit hareketini izleyin.',
      'Record collections and payments and track cash movements.',
      'finance',
      20,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'finance_cashflow_basic') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'finance_cashflow_basic',
      'Temel Nakit Akışı Raporları',
      'Basic Cash Flow Reports',
      'Giren/çıkan nakdi basit raporlarla görün.',
      'See inflows and outflows with simple cash flow reports.',
      'finance',
      30,
      false
    );
  END IF;

  -- INVENTORY
  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'inventory_products') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'inventory_products',
      'Ürün / Stok Kartları',
      'Product / Stock Cards',
      'Tüm ürün ve stok kartlarınızı yönetin.',
      'Manage all your product and stock cards.',
      'inventory',
      10,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'inventory_warehouses') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'inventory_warehouses',
      'Depolar ve Stok Hareketleri',
      'Warehouses & Stock Movements',
      'Birden çok depo ve aralarındaki stok hareketlerini takip edin.',
      'Track multiple warehouses and stock movements between them.',
      'inventory',
      20,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'inventory_critical_stock_alerts') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'inventory_critical_stock_alerts',
      'Kritik Stok Uyarıları',
      'Critical Stock Alerts',
      'Belirlediğiniz seviyenin altına düşen ürünler için uyarı alın.',
      'Get alerts when products fall below critical stock levels.',
      'inventory',
      30,
      false
    );
  END IF;

  -- PROCUREMENT
  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'procurement_orders') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'procurement_orders',
      'Satınalma Siparişleri',
      'Purchase Orders',
      'Tedarikçileriniz için satınalma siparişleri oluşturun.',
      'Create purchase orders for your suppliers.',
      'procurement',
      10,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'procurement_suppliers') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'procurement_suppliers',
      'Tedarikçi Yönetimi',
      'Supplier Management',
      'Tedarikçi tekliflerini ve fiyatlarını yönetin.',
      'Manage supplier offers and prices.',
      'procurement',
      20,
      false
    );
  END IF;

  -- PRODUCTION
  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'production_orders') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'production_orders',
      'Üretim Emirleri',
      'Production Orders',
      'Üretim emirlerinizi oluşturun ve durumlarını izleyin.',
      'Create production orders and track their status.',
      'production',
      10,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'production_material_planning') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'production_material_planning',
      'Malzeme İhtiyaç Planlaması',
      'Material Planning',
      'Üretim için gerekli malzemeleri planlayın.',
      'Plan the materials required for production.',
      'production',
      20,
      false
    );
  END IF;

  -- PROJECTS & CRM
  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'projects_basic') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'projects_basic',
      'Projelerde Takip',
      'Basic Projects',
      'Fatura ve giderleri projeler altında gruplayın.',
      'Group invoices and expenses under projects.',
      'projects',
      10,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'projects_profitability') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'projects_profitability',
      'Proje Kârlılık Raporları',
      'Project Profitability Reports',
      'Projeler bazında kârlılığı takip edin.',
      'Track profitability per project.',
      'projects',
      20,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'crm_customers') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'crm_customers',
      'Müşteri Kartları',
      'Customer Cards',
      'Müşteri bilgilerini ve bakiyelerini tek yerde yönetin.',
      'Manage customer details and balances in one place.',
      'crm',
      10,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'crm_merge_tool') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'crm_merge_tool',
      'Müşteri Birleştirme Aracı',
      'Customer Merge Tool',
      'Çift müşteri kayıtlarını kolayca birleştirin.',
      'Merge duplicate customer records easily.',
      'crm',
      20,
      false
    );
  END IF;

  -- AI & REPORTING
  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'ai_accounting_assistant') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'ai_accounting_assistant',
      'AI Muhasebe Asistanı',
      'AI Accounting Assistant',
      'Muhasebe sorularınızı yapay zekaya sorun.',
      'Ask your accounting questions to AI.',
      'ai',
      10,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'ai_cashflow_assistant') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'ai_cashflow_assistant',
      'AI Nakit Akışı Asistanı',
      'AI Cash Flow Assistant',
      'Nakit akışı senaryolarını yapay zekaya sorun.',
      'Ask AI about your cash flow scenarios.',
      'ai',
      20,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'ai_production_assistant') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'ai_production_assistant',
      'AI Üretim Asistanı',
      'AI Production Assistant',
      'Üretim planlaması için yapay zeka önerileri alın.',
      'Get AI recommendations for production planning.',
      'ai',
      30,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'reporting_dashboards') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'reporting_dashboards',
      'Yönetici Panosu',
      'Executive Dashboard',
      'Satış, gider, nakit ve kârlılığı tek panoda görün.',
      'See sales, expenses, cash and profit in one dashboard.',
      'reporting',
      10,
      false
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'reporting_exports') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'reporting_exports',
      'Excel / CSV Dışa Aktarım',
      'Excel / CSV Export',
      'Raporları Excel/CSV olarak dışa aktarın.',
      'Export reports to Excel / CSV for deeper analysis.',
      'reporting',
      20,
      false
    );
  END IF;

  -- LIMIT FEATURES
  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'limit_customers') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'limit_customers',
      'Müşteri Limiti',
      'Customer Limit',
      'Maksimum müşteri sayısı.',
      'Maximum number of customers.',
      'limits',
      10,
      true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'limit_products') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'limit_products',
      'Ürün / Stok Limiti',
      'Product / Stock Limit',
      'Maksimum ürün / stok kartı sayısı.',
      'Maximum number of product / stock cards.',
      'limits',
      20,
      true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'limit_invoices_per_month') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'limit_invoices_per_month',
      'Aylık Fatura Limiti',
      'Monthly Invoice Limit',
      'Aylık oluşturulabilecek maksimum fatura sayısı.',
      'Maximum number of invoices per month.',
      'limits',
      30,
      true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'limit_users') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'limit_users',
      'Kullanıcı Limiti',
      'User Limit',
      'Maksimum eşzamanlı kullanıcı sayısı.',
      'Maximum number of concurrent users.',
      'limits',
      40,
      true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'limit_projects') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'limit_projects',
      'Proje Limiti',
      'Project Limit',
      'Maksimum proje sayısı.',
      'Maximum number of projects.',
      'limits',
      50,
      true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM plan_features WHERE feature_key = 'limit_ai_queries_per_month') THEN
    INSERT INTO plan_features (feature_key, name_tr, name_en, description_tr, description_en, category, display_order, is_limit)
    VALUES (
      'limit_ai_queries_per_month',
      'Aylık AI Sorgu Limiti',
      'Monthly AI Query Limit',
      'Aylık yapılabilecek maksimum yapay zeka sorgu sayısı.',
      'Maximum number of AI queries per month.',
      'limits',
      60,
      true
    );
  END IF;

END $$;


----------------------------------------
-- 2) plan_feature_assignments seeding
----------------------------------------

-- Temizlik: ilgili planlar için eski assignment'ları kaldır
DELETE FROM plan_feature_assignments
WHERE plan_id IN (
  SELECT id FROM subscription_plans WHERE plan_code IN ('FREE', 'KUCUK', 'ORTA', 'BUYUK', 'ENTERPRISE')
);


-- FREE plan: temel özellikler + düşük limitler
INSERT INTO plan_feature_assignments (plan_id, feature_id, enabled, limit_value)
SELECT p.id, f.id, true, NULL
FROM subscription_plans p
JOIN plan_features f ON f.feature_key IN (
  'core_dashboard',
  'core_multi_language',
  'sales_invoices_basic',
  'crm_customers'
)
WHERE p.plan_code = 'FREE';

INSERT INTO plan_feature_assignments (plan_id, feature_id, enabled, limit_value)
SELECT p.id, f.id, true, v.limit_value
FROM subscription_plans p
CROSS JOIN LATERAL (
  VALUES
    ('limit_customers', '25'),
    ('limit_products', '50'),
    ('limit_invoices_per_month', '15'),
    ('limit_users', '1'),
    ('limit_projects', '0'),
    ('limit_ai_queries_per_month', '0')
) AS v(feature_key, limit_value)
JOIN plan_features f ON f.feature_key = v.feature_key
WHERE p.plan_code = 'FREE';


-- KUCUK plan: küçük işletmeler için ek modüller + orta limitler
INSERT INTO plan_feature_assignments (plan_id, feature_id, enabled, limit_value)
SELECT p.id, f.id, true, NULL
FROM subscription_plans p
JOIN plan_features f ON f.feature_key IN (
  'core_dashboard',
  'core_multi_language',
  'sales_invoices_basic',
  'inventory_products',
  'inventory_warehouses',
  'expenses_purchase_invoices',
  'finance_accounts',
  'finance_transactions',
  'crm_customers'
)
WHERE p.plan_code = 'KUCUK';

INSERT INTO plan_feature_assignments (plan_id, feature_id, enabled, limit_value)
SELECT p.id, f.id, true, v.limit_value
FROM subscription_plans p
CROSS JOIN LATERAL (
  VALUES
    ('limit_customers', '250'),
    ('limit_products', '500'),
    ('limit_invoices_per_month', 'UNLIMITED'),
    ('limit_users', '3'),
    ('limit_projects', '10'),
    ('limit_ai_queries_per_month', '100')
) AS v(feature_key, limit_value)
JOIN plan_features f ON f.feature_key = v.feature_key
WHERE p.plan_code = 'KUCUK';


-- ORTA plan: büyüyen KOBİ’ler için gelişmiş modüller
INSERT INTO plan_feature_assignments (plan_id, feature_id, enabled, limit_value)
SELECT p.id, f.id, true, NULL
FROM subscription_plans p
JOIN plan_features f ON f.feature_key IN (
  'core_dashboard',
  'core_multi_language',
  'core_multi_currency',
  'sales_invoices_basic',
  'sales_invoices_advanced_types',
  'sales_einvoice_integration',
  'einvoice_center_incoming_outgoing',
  'einvoice_preview_before_import',
  'expenses_purchase_invoices',
  'expenses_receipt_ocr',
  'expenses_auto_supplier_create',
  'expenses_einvoice_import',
  'inventory_products',
  'inventory_warehouses',
  'inventory_critical_stock_alerts',
  'finance_accounts',
  'finance_transactions',
  'finance_cashflow_basic',
  'projects_basic',
  'projects_profitability',
  'crm_customers',
  'crm_merge_tool',
  'reporting_dashboards',
  'reporting_exports',
  'ai_accounting_assistant',
  'ai_cashflow_assistant'
)
WHERE p.plan_code = 'ORTA';

INSERT INTO plan_feature_assignments (plan_id, feature_id, enabled, limit_value)
SELECT p.id, f.id, true, v.limit_value
FROM subscription_plans p
CROSS JOIN LATERAL (
  VALUES
    ('limit_customers', 'UNLIMITED'),
    ('limit_products', 'UNLIMITED'),
    ('limit_invoices_per_month', 'UNLIMITED'),
    ('limit_users', '10'),
    ('limit_projects', '50'),
    ('limit_ai_queries_per_month', '500')
) AS v(feature_key, limit_value)
JOIN plan_features f ON f.feature_key = v.feature_key
WHERE p.plan_code = 'ORTA';


-- BUYUK plan: yüksek hacimli işletmeler için ek modüller + yüksek limitler
INSERT INTO plan_feature_assignments (plan_id, feature_id, enabled, limit_value)
SELECT p.id, f.id, true, NULL
FROM subscription_plans p
JOIN plan_features f ON f.feature_key IN (
  'core_dashboard',
  'core_multi_language',
  'core_multi_currency',
  'sales_invoices_basic',
  'sales_invoices_advanced_types',
  'sales_einvoice_integration',
  'einvoice_center_incoming_outgoing',
  'einvoice_preview_before_import',
  'expenses_purchase_invoices',
  'expenses_receipt_ocr',
  'expenses_auto_supplier_create',
  'expenses_einvoice_import',
  'inventory_products',
  'inventory_warehouses',
  'inventory_critical_stock_alerts',
  'finance_accounts',
  'finance_transactions',
  'finance_cashflow_basic',
  'projects_basic',
  'projects_profitability',
  'crm_customers',
  'crm_merge_tool',
  'reporting_dashboards',
  'reporting_exports',
  'ai_accounting_assistant',
  'ai_cashflow_assistant',
  'procurement_orders',
  'procurement_suppliers',
  'production_orders',
  'production_material_planning',
  'ai_production_assistant'
)
WHERE p.plan_code = 'BUYUK';

INSERT INTO plan_feature_assignments (plan_id, feature_id, enabled, limit_value)
SELECT p.id, f.id, true, v.limit_value
FROM subscription_plans p
CROSS JOIN LATERAL (
  VALUES
    ('limit_customers', 'UNLIMITED'),
    ('limit_products', 'UNLIMITED'),
    ('limit_invoices_per_month', 'UNLIMITED'),
    ('limit_users', '25'),
    ('limit_projects', '200'),
    ('limit_ai_queries_per_month', '2000')
) AS v(feature_key, limit_value)
JOIN plan_features f ON f.feature_key = v.feature_key
WHERE p.plan_code = 'BUYUK';


-- ENTERPRISE plan: tüm özellikler + neredeyse sınırsız limitler (sözleşmeye göre)
INSERT INTO plan_feature_assignments (plan_id, feature_id, enabled, limit_value)
SELECT p.id, f.id, true, NULL
FROM subscription_plans p
JOIN plan_features f ON f.feature_key IN (
  'core_dashboard',
  'core_multi_language',
  'core_multi_currency',
  'sales_invoices_basic',
  'sales_invoices_advanced_types',
  'sales_einvoice_integration',
  'sales_bulk_invoicing',
  'sales_offer_management',
  'sales_campaigns',
  'einvoice_center_incoming_outgoing',
  'einvoice_preview_before_import',
  'einvoice_status_tracking',
  'expenses_purchase_invoices',
  'expenses_receipt_ocr',
  'expenses_auto_supplier_create',
  'expenses_einvoice_import',
  'inventory_products',
  'inventory_warehouses',
  'inventory_critical_stock_alerts',
  'finance_accounts',
  'finance_transactions',
  'finance_cashflow_basic',
  'projects_basic',
  'projects_profitability',
  'crm_customers',
  'crm_merge_tool',
  'procurement_orders',
  'procurement_suppliers',
  'production_orders',
  'production_material_planning',
  'reporting_dashboards',
  'reporting_exports',
  'ai_accounting_assistant',
  'ai_cashflow_assistant',
  'ai_production_assistant'
)
WHERE p.plan_code = 'ENTERPRISE';

INSERT INTO plan_feature_assignments (plan_id, feature_id, enabled, limit_value)
SELECT p.id, f.id, true, v.limit_value
FROM subscription_plans p
CROSS JOIN LATERAL (
  VALUES
    ('limit_customers', 'UNLIMITED'),
    ('limit_products', 'UNLIMITED'),
    ('limit_invoices_per_month', 'UNLIMITED'),
    ('limit_users', 'UNLIMITED'),
    ('limit_projects', 'UNLIMITED'),
    ('limit_ai_queries_per_month', 'UNLIMITED')
) AS v(feature_key, limit_value)
JOIN plan_features f ON f.feature_key = v.feature_key
WHERE p.plan_code = 'ENTERPRISE';

