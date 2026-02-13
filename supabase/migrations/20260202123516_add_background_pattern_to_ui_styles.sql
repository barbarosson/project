/*
  # Add Background Pattern Support to UI Styles

  ## Changes
  
  1. **ui_styles table updates**
     - Add `background_pattern` (text) - URL to SVG pattern or CSS background-image value
     - Add `background_pattern_opacity` (decimal) - Opacity control for pattern (0.0 to 1.0)
     - Add `background_pattern_type` (text) - Predefined pattern type (micro-dots, circuit-grid, soft-waves, custom)

  ## Purpose
  
  Enable custom background patterns for hero sections and landing pages with CMS control.
*/

-- Add background pattern fields to ui_styles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ui_styles' AND column_name = 'background_pattern'
  ) THEN
    ALTER TABLE public.ui_styles ADD COLUMN background_pattern text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ui_styles' AND column_name = 'background_pattern_opacity'
  ) THEN
    ALTER TABLE public.ui_styles ADD COLUMN background_pattern_opacity decimal(3,2) DEFAULT 0.1 CHECK (background_pattern_opacity >= 0 AND background_pattern_opacity <= 1);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ui_styles' AND column_name = 'background_pattern_type'
  ) THEN
    ALTER TABLE public.ui_styles ADD COLUMN background_pattern_type text DEFAULT 'none' CHECK (background_pattern_type IN ('none', 'micro-dots', 'circuit-grid', 'soft-waves', 'custom'));
  END IF;
END $$;