/*
  # Navigation Menus Çoklu Dil Desteği

  1. Yeni Kolonlar
    - `label_en` (text) - İngilizce etiket
    - `label_tr` (text) - Türkçe etiket
    - `description_en` (text) - İngilizce açıklama
    - `description_tr` (text) - Türkçe açıklama

  2. Güncelleme
    - Mevcut label değerlerini label_tr'ye kopyala
    - label_en için varsayılan değerler oluştur
*/

-- label_en kolonu ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'navigation_menus' AND column_name = 'label_en'
  ) THEN
    ALTER TABLE navigation_menus ADD COLUMN label_en text;
  END IF;
END $$;

-- label_tr kolonu ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'navigation_menus' AND column_name = 'label_tr'
  ) THEN
    ALTER TABLE navigation_menus ADD COLUMN label_tr text;
  END IF;
END $$;

-- description_en kolonu ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'navigation_menus' AND column_name = 'description_en'
  ) THEN
    ALTER TABLE navigation_menus ADD COLUMN description_en text;
  END IF;
END $$;

-- description_tr kolonu ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'navigation_menus' AND column_name = 'description_tr'
  ) THEN
    ALTER TABLE navigation_menus ADD COLUMN description_tr text;
  END IF;
END $$;

-- Mevcut label değerlerini label_tr'ye kopyala (eğer label_tr boşsa)
UPDATE navigation_menus 
SET label_tr = label 
WHERE label_tr IS NULL AND label IS NOT NULL;

-- label_en için temel çeviriler oluştur
UPDATE navigation_menus SET label_en = 'Dashboard' WHERE slug = 'dashboard' AND label_en IS NULL;
UPDATE navigation_menus SET label_en = 'Customers' WHERE slug = 'customers' AND label_en IS NULL;
UPDATE navigation_menus SET label_en = 'Invoices' WHERE slug = 'invoices' AND label_en IS NULL;
UPDATE navigation_menus SET label_en = 'Products' WHERE slug = 'inventory' AND label_en IS NULL;
UPDATE navigation_menus SET label_en = 'Expenses' WHERE slug = 'expenses' AND label_en IS NULL;
UPDATE navigation_menus SET label_en = 'Reports' WHERE slug = 'reports' AND label_en IS NULL;
UPDATE navigation_menus SET label_en = 'Settings' WHERE slug = 'settings' AND label_en IS NULL;
UPDATE navigation_menus SET label_en = 'CRM' WHERE slug = 'crm' AND label_en IS NULL;
UPDATE navigation_menus SET label_en = 'Projects' WHERE slug = 'projects' AND label_en IS NULL;
UPDATE navigation_menus SET label_en = 'Production' WHERE slug = 'production' AND label_en IS NULL;
UPDATE navigation_menus SET label_en = 'Warehouses' WHERE slug = 'warehouses' AND label_en IS NULL;
UPDATE navigation_menus SET label_en = 'Branches' WHERE slug = 'branches' AND label_en IS NULL;
UPDATE navigation_menus SET label_en = 'Finance Robot' WHERE slug = 'finance-robot' AND label_en IS NULL;
UPDATE navigation_menus SET label_en = 'AI Insights' WHERE slug = 'ai-insights' AND label_en IS NULL;
UPDATE navigation_menus SET label_en = 'Help' WHERE slug = 'help' AND label_en IS NULL;

-- Diğer menüler için label'dan kopyala
UPDATE navigation_menus 
SET label_en = label 
WHERE label_en IS NULL AND label IS NOT NULL;
