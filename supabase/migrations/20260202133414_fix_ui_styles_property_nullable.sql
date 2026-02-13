/*
  # Fix ui_styles property Column NOT NULL Constraint
  
  ## Summary
  The Visual Styles Controller inserts global style configuration without using the "property" field.
  This migration makes "property" nullable to support global UI style settings.
  
  ## Changes
  
  1. **Modified Columns**
     - `property` → Changed from NOT NULL to nullable
  
  2. **Reasoning**
     - Visual Styles Controller manages global styles (colors, dimensions, spacing)
     - The component doesn't use element-specific properties
     - Global UI configuration doesn't need a property value
  
  ## Notes
  - Allows both global styles (property = NULL) and element-specific styles (property = value)
  - No data loss - only constraint relaxation
  - Existing element-specific styles remain unaffected
*/

-- Make property column nullable in ui_styles table
DO $$
BEGIN
  -- Check if column exists and is NOT NULL
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'ui_styles' 
    AND column_name = 'property'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE ui_styles ALTER COLUMN property DROP NOT NULL;
  END IF;
END $$;