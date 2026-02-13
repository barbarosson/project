/*
  # Add Full Width Image Option to CMS Banners

  1. Changes
    - Add `full_width_image` boolean to control whether image spans entire banner width
  
  2. Purpose
    - When true, image will cover the entire banner area (edge-to-edge)
    - Content will be overlaid on top of the image
    - Works with all layout types for maximum visual impact
*/

-- Add full_width_image column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cms_banners' AND column_name = 'full_width_image'
  ) THEN
    ALTER TABLE cms_banners ADD COLUMN full_width_image boolean DEFAULT false;
  END IF;
END $$;

COMMENT ON COLUMN cms_banners.full_width_image IS 'When true, image covers entire banner width with content overlaid on top';