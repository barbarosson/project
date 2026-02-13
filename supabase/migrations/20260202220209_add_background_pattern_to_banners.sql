/*
  # Add Background Pattern Support to Banners

  ## Summary
  Adds background pattern customization support to cms_banners table.
  Users can now select from predefined patterns or use solid colors.

  ## Changes
  
  1. **New Column**
     - `background_pattern` (text, nullable)
       - Stores pattern identifier or 'none' for solid color
       - Options: 'none', 'dots', 'grid', 'waves', 'circuit', 'custom-url'
       - Default: 'none'
  
  2. **Use Cases**
     - Solid color: background_pattern = 'none' + background_color
     - Predefined pattern: background_pattern = 'dots' + background_color
     - Custom pattern: background_pattern = URL to pattern image
  
  ## Notes
  - Backward compatible: existing banners will have pattern = 'none'
  - Patterns can be overlaid with background_color for tinting
*/

-- Add background_pattern column to cms_banners
ALTER TABLE cms_banners 
ADD COLUMN IF NOT EXISTS background_pattern text DEFAULT 'none';

-- Add comment for documentation
COMMENT ON COLUMN cms_banners.background_pattern IS 'Background pattern: none, dots, grid, waves, circuit, or custom URL';
