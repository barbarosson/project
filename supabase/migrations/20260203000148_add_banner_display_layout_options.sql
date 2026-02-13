/*
  # Add Dynamic Layout Options to CMS Banners

  1. Changes
    - Add `layout_type` column to control banner display style
    - Add `height` column for custom height values
    - Add `content_alignment` column for flexible positioning
  
  2. Layout Types
    - 'compact': Normal banner with padding (default)
    - 'full-width': Full width container, medium height
    - 'hero': Full viewport height, hero-style display
    - 'custom': Custom height based on height column
  
  3. Content Alignment
    - 'left': Content aligned to left
    - 'center': Content centered
    - 'right': Content aligned to right
*/

-- Add layout_type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cms_banners' AND column_name = 'layout_type'
  ) THEN
    ALTER TABLE cms_banners ADD COLUMN layout_type text DEFAULT 'compact' CHECK (layout_type IN ('compact', 'full-width', 'hero', 'custom'));
  END IF;
END $$;

-- Add height column for custom heights (in pixels or viewport units)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cms_banners' AND column_name = 'height'
  ) THEN
    ALTER TABLE cms_banners ADD COLUMN height text DEFAULT '400px';
  END IF;
END $$;

-- Add content_alignment column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cms_banners' AND column_name = 'content_alignment'
  ) THEN
    ALTER TABLE cms_banners ADD COLUMN content_alignment text DEFAULT 'center' CHECK (content_alignment IN ('left', 'center', 'right'));
  END IF;
END $$;

-- Add image_position column (left, right, background)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cms_banners' AND column_name = 'image_position'
  ) THEN
    ALTER TABLE cms_banners ADD COLUMN image_position text DEFAULT 'left' CHECK (image_position IN ('left', 'right', 'background', 'none'));
  END IF;
END $$;

-- Add overlay_opacity for background images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cms_banners' AND column_name = 'overlay_opacity'
  ) THEN
    ALTER TABLE cms_banners ADD COLUMN overlay_opacity integer DEFAULT 50 CHECK (overlay_opacity >= 0 AND overlay_opacity <= 100);
  END IF;
END $$;

COMMENT ON COLUMN cms_banners.layout_type IS 'Display style: compact (default), full-width (full width), hero (full viewport), custom (custom height)';
COMMENT ON COLUMN cms_banners.height IS 'Custom height for layout_type=custom (e.g., 500px, 80vh)';
COMMENT ON COLUMN cms_banners.content_alignment IS 'Content alignment: left, center, right';
COMMENT ON COLUMN cms_banners.image_position IS 'Image position: left, right, background, none';
COMMENT ON COLUMN cms_banners.overlay_opacity IS 'Overlay opacity for background images (0-100)';