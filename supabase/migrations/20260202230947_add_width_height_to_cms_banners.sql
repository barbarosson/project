/*
  # Add Width and Height Columns to CMS Banners

  1. Changes
    - Add `width` column (integer, optional) to cms_banners table
    - Add `height` column (integer, optional) to cms_banners table
    - These columns allow banner size customization in Banner Studio
    
  2. Details
    - Width: percentage-based width (1-100), defaults to 100
    - Height: pixel-based height (100-800), defaults to 300
    - Both columns are nullable for backward compatibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cms_banners' AND column_name = 'width'
  ) THEN
    ALTER TABLE cms_banners ADD COLUMN width integer DEFAULT 100;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cms_banners' AND column_name = 'height'
  ) THEN
    ALTER TABLE cms_banners ADD COLUMN height integer DEFAULT 300;
  END IF;
END $$;

COMMENT ON COLUMN cms_banners.width IS 'Banner width as percentage (1-100)';
COMMENT ON COLUMN cms_banners.height IS 'Banner height in pixels (100-800)';
