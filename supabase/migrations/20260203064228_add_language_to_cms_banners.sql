/*
  # Add Language Support to CMS Banners

  1. Changes
    - Add `language` column to `cms_banners` table
      - Values: 'tr', 'en', 'all' (default: 'all')
      - Allows filtering banners by language preference
    - Add index on language for better query performance
  
  2. Purpose
    - Enable language-specific banner display
    - Support showing different banners for TR and EN users
    - Allow carousel of multiple banners per position/language combination
*/

-- Add language column to cms_banners
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cms_banners' AND column_name = 'language'
  ) THEN
    ALTER TABLE cms_banners 
    ADD COLUMN language text NOT NULL DEFAULT 'all' 
    CHECK (language IN ('tr', 'en', 'all'));
  END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_cms_banners_language ON cms_banners(language);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_cms_banners_page_position_language 
ON cms_banners(page_slug, position, language, order_index);
