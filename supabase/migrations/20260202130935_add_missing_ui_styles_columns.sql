/*
  # Add Missing UI Styles Columns
  
  ## Summary
  The `ui_styles` table is missing columns required by the Visual Styles Controller.
  This migration adds all missing columns for colors, dimensions, and layout settings.
  
  ## Changes
  
  1. **New Columns Added**
     - `logo_width` (numeric) - Logo width in pixels
     - `logo_height` (numeric) - Logo height in pixels
     - `section_padding_y` (numeric) - Vertical section padding
     - `section_padding_x` (numeric) - Horizontal section padding
     - `primary_color` (text) - Primary brand color (hex)
     - `secondary_color` (text) - Secondary brand color (hex)
     - `accent_color` (text) - Accent color (hex)
     - `heading_font_size` (numeric) - Heading font size in pixels
     - `body_font_size` (numeric) - Body font size in pixels
     - `border_radius` (numeric) - Default border radius in pixels
  
  2. **Safety**
     - Uses IF NOT EXISTS pattern to prevent errors
     - All columns are nullable to allow gradual adoption
     - No existing data is modified
  
  ## Notes
  - These columns store global UI configuration values
  - The Visual Styles Controller uses these for real-time preview
  - Values are injected as CSS variables into the document root
*/

-- Add logo dimensions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ui_styles' AND column_name = 'logo_width'
  ) THEN
    ALTER TABLE ui_styles ADD COLUMN logo_width numeric;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ui_styles' AND column_name = 'logo_height'
  ) THEN
    ALTER TABLE ui_styles ADD COLUMN logo_height numeric;
  END IF;
END $$;

-- Add section padding
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ui_styles' AND column_name = 'section_padding_y'
  ) THEN
    ALTER TABLE ui_styles ADD COLUMN section_padding_y numeric;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ui_styles' AND column_name = 'section_padding_x'
  ) THEN
    ALTER TABLE ui_styles ADD COLUMN section_padding_x numeric;
  END IF;
END $$;

-- Add colors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ui_styles' AND column_name = 'primary_color'
  ) THEN
    ALTER TABLE ui_styles ADD COLUMN primary_color text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ui_styles' AND column_name = 'secondary_color'
  ) THEN
    ALTER TABLE ui_styles ADD COLUMN secondary_color text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ui_styles' AND column_name = 'accent_color'
  ) THEN
    ALTER TABLE ui_styles ADD COLUMN accent_color text;
  END IF;
END $$;

-- Add typography
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ui_styles' AND column_name = 'heading_font_size'
  ) THEN
    ALTER TABLE ui_styles ADD COLUMN heading_font_size numeric;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ui_styles' AND column_name = 'body_font_size'
  ) THEN
    ALTER TABLE ui_styles ADD COLUMN body_font_size numeric;
  END IF;
END $$;

-- Add border radius
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ui_styles' AND column_name = 'border_radius'
  ) THEN
    ALTER TABLE ui_styles ADD COLUMN border_radius numeric;
  END IF;
END $$;

-- Insert default row if table is empty
INSERT INTO ui_styles (
  id,
  logo_width,
  logo_height,
  section_padding_y,
  section_padding_x,
  primary_color,
  secondary_color,
  accent_color,
  heading_font_size,
  body_font_size,
  border_radius,
  background_pattern_type,
  background_pattern,
  background_pattern_opacity,
  is_global
)
SELECT
  gen_random_uuid(),
  180,
  60,
  80,
  24,
  '#3b82f6',
  '#8b5cf6',
  '#10b981',
  48,
  16,
  8,
  'none',
  '',
  0.1,
  true
WHERE NOT EXISTS (SELECT 1 FROM ui_styles LIMIT 1);