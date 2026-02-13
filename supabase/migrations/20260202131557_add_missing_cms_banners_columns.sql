/*
  # Add Missing Columns to cms_banners
  
  ## Summary
  The Assets Manager component requires additional columns in cms_banners table.
  This migration adds simple text columns for better asset management compatibility.
  
  ## Changes
  
  1. **New Columns Added**
     - `alt_text` (text) - Alternative text for images (SEO/accessibility)
     - `title` (text) - Simple title field (non-localized)
     - `button_text` (text) - Simple button text (non-localized)
     - `button_url` (text) - Button URL/link
  
  2. **Safety**
     - All columns are nullable to maintain backward compatibility
     - Existing localized fields (title_en/tr, cta_text_en/tr) remain unchanged
     - No data loss or modification
  
  ## Notes
  - These columns complement existing localized fields
  - Assets Manager uses these for simple asset tracking
  - Localized fields continue to work for multi-language content
*/

-- Add alt_text for SEO and accessibility
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cms_banners' AND column_name = 'alt_text'
  ) THEN
    ALTER TABLE cms_banners ADD COLUMN alt_text text;
  END IF;
END $$;

-- Add simple title field (non-localized)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cms_banners' AND column_name = 'title'
  ) THEN
    ALTER TABLE cms_banners ADD COLUMN title text;
  END IF;
END $$;

-- Add simple button text (non-localized)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cms_banners' AND column_name = 'button_text'
  ) THEN
    ALTER TABLE cms_banners ADD COLUMN button_text text;
  END IF;
END $$;

-- Add button URL
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cms_banners' AND column_name = 'button_url'
  ) THEN
    ALTER TABLE cms_banners ADD COLUMN button_url text;
  END IF;
END $$;