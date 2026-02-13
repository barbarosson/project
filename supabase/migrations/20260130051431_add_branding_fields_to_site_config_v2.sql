/*
  # Add Branding Fields to Site Config Table

  ## Changes
  
  Add essential branding fields that were missing from site_config table:
  
  1. **Site Identity**
    - site_name_en / site_name_tr
    - tagline_en / tagline_tr
    - logo_url / logo_url_dark
  
  2. **Brand Colors**
    - primary_color
    - secondary_color
    - accent_color
  
  3. **Contact Information**
    - contact_email
    - contact_phone
    - contact_address

  ## Notes
  - All fields are optional (nullable)
  - Default values provided where appropriate
*/

-- Add site identity fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'site_name_en') THEN
    ALTER TABLE site_config ADD COLUMN site_name_en text DEFAULT 'Modulus ERP';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'site_name_tr') THEN
    ALTER TABLE site_config ADD COLUMN site_name_tr text DEFAULT 'Modulus ERP';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'tagline_en') THEN
    ALTER TABLE site_config ADD COLUMN tagline_en text DEFAULT 'Smart Business Management';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'tagline_tr') THEN
    ALTER TABLE site_config ADD COLUMN tagline_tr text DEFAULT 'Akıllı İşletme Yönetimi';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'logo_url') THEN
    ALTER TABLE site_config ADD COLUMN logo_url text DEFAULT '/modulustech-logo.svg';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'logo_url_dark') THEN
    ALTER TABLE site_config ADD COLUMN logo_url_dark text DEFAULT '/modulustech-logo.svg';
  END IF;
END $$;

-- Add brand color fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'primary_color') THEN
    ALTER TABLE site_config ADD COLUMN primary_color text DEFAULT '#2ECC71';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'secondary_color') THEN
    ALTER TABLE site_config ADD COLUMN secondary_color text DEFAULT '#3498DB';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'accent_color') THEN
    ALTER TABLE site_config ADD COLUMN accent_color text DEFAULT '#E74C3C';
  END IF;
END $$;

-- Add contact information fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'contact_email') THEN
    ALTER TABLE site_config ADD COLUMN contact_email text DEFAULT 'info@modulustech.com';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'contact_phone') THEN
    ALTER TABLE site_config ADD COLUMN contact_phone text DEFAULT '+1 (555) 123-4567';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'contact_address') THEN
    ALTER TABLE site_config ADD COLUMN contact_address text DEFAULT '123 Business Street, Tech City, TC 12345';
  END IF;
END $$;

-- Ensure there's at least one row in site_config table with proper key
INSERT INTO site_config (id, key, value) 
VALUES ('00000000-0000-0000-0000-000000000001', 'site_settings', 'default')
ON CONFLICT (id) DO NOTHING;