/*
  # Add Trust Indicators to Site Config
  
  ## Summary
  Adds trust indicator and statistics fields to site_config table.
  These allow admins to manage social proof messaging from Site Commander.
  
  ## Changes
  
  1. **Trust Indicators**
     - trust_badge_en (text) - Social proof message in English
     - trust_badge_tr (text) - Social proof message in Turkish
     - Default: "Trusted by 10,000+ businesses" / "10.000+ işletme tarafından güveniliyor"
  
  2. **Statistics Fields**
     - stats_customers_count (integer) - Number of customers
     - stats_transactions_count (integer) - Number of transactions
     - stats_years_active (integer) - Years in business
     - stats_satisfaction_rate (integer) - Customer satisfaction percentage
  
  ## Use Cases
  - Display social proof on landing pages
  - Show credibility metrics
  - Update statistics from Site Commander
  
  ## Notes
  - All fields are nullable for flexibility
  - Default values provided for immediate use
  - Admins can customize via Site Commander
*/

-- Add trust indicator fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'trust_badge_en') THEN
    ALTER TABLE site_config ADD COLUMN trust_badge_en text DEFAULT 'Trusted by 10,000+ businesses';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'trust_badge_tr') THEN
    ALTER TABLE site_config ADD COLUMN trust_badge_tr text DEFAULT '10.000+ işletme tarafından güveniliyor';
  END IF;
END $$;

-- Add statistics fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'stats_customers_count') THEN
    ALTER TABLE site_config ADD COLUMN stats_customers_count integer DEFAULT 10000;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'stats_transactions_count') THEN
    ALTER TABLE site_config ADD COLUMN stats_transactions_count integer DEFAULT 1000000;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'stats_years_active') THEN
    ALTER TABLE site_config ADD COLUMN stats_years_active integer DEFAULT 5;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_config' AND column_name = 'stats_satisfaction_rate') THEN
    ALTER TABLE site_config ADD COLUMN stats_satisfaction_rate integer DEFAULT 98;
  END IF;
END $$;

-- Add helpful comments
COMMENT ON COLUMN site_config.trust_badge_en IS 'Social proof message displayed on landing pages (English)';
COMMENT ON COLUMN site_config.trust_badge_tr IS 'Social proof message displayed on landing pages (Turkish)';
COMMENT ON COLUMN site_config.stats_customers_count IS 'Number of customers for statistics display';
COMMENT ON COLUMN site_config.stats_transactions_count IS 'Number of transactions for statistics display';
COMMENT ON COLUMN site_config.stats_years_active IS 'Years in business for statistics display';
COMMENT ON COLUMN site_config.stats_satisfaction_rate IS 'Customer satisfaction percentage for statistics display';
