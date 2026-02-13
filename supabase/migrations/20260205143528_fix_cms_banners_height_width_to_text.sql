/*
  # Fix CMS Banners Height and Width Column Types

  1. Changes
    - Change `height` column from integer to text to support CSS values
    - Change `width` column from integer to text for consistency

  2. Details
    - Height needs to support CSS units like '400px', '80vh', '50rem'
    - Width should also support percentage and viewport units
    - Converts existing integer values to text with appropriate suffixes
    - This fixes the "invalid input syntax for type integer: '400px'" error

  3. Migration Strategy
    - Add new text columns
    - Copy and convert data
    - Drop old columns
    - Rename new columns
*/

-- Add temporary text columns
ALTER TABLE cms_banners 
  ADD COLUMN IF NOT EXISTS height_text text,
  ADD COLUMN IF NOT EXISTS width_text text;

-- Copy existing data and convert to CSS format
UPDATE cms_banners
SET 
  height_text = CASE 
    WHEN height IS NOT NULL THEN height::text || 'px'
    ELSE '400px'
  END,
  width_text = CASE 
    WHEN width IS NOT NULL THEN width::text || '%'
    ELSE '100%'
  END;

-- Drop old integer columns
ALTER TABLE cms_banners 
  DROP COLUMN IF EXISTS height,
  DROP COLUMN IF EXISTS width;

-- Rename new columns to original names
ALTER TABLE cms_banners 
  RENAME COLUMN height_text TO height;

ALTER TABLE cms_banners 
  RENAME COLUMN width_text TO width;

-- Set defaults
ALTER TABLE cms_banners 
  ALTER COLUMN height SET DEFAULT '400px',
  ALTER COLUMN width SET DEFAULT '100%';

-- Add comments
COMMENT ON COLUMN cms_banners.height IS 'Banner height as CSS value (e.g., 400px, 80vh, 50rem)';
COMMENT ON COLUMN cms_banners.width IS 'Banner width as CSS value (e.g., 100%, 80vw, 1200px)';
