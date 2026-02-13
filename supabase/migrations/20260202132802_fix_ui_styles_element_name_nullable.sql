/*
  # Fix ui_styles element_name NOT NULL Constraint
  
  ## Summary
  The Visual Styles Controller doesn't use element_name field.
  This migration makes it nullable to allow global UI style configuration.
  
  ## Changes
  
  1. **Modified Columns**
     - `element_name` → Changed from NOT NULL to nullable
  
  2. **Reasoning**
     - Visual Styles Controller manages global styles without element-specific targeting
     - The component inserts records without element_name values
     - Making it nullable allows both global and element-specific styles
  
  ## Notes
  - Existing element-specific styles remain unaffected
  - Global styles can now be saved without element_name
  - No data loss - only constraint relaxation
*/

-- Make element_name nullable in ui_styles table
DO $$
BEGIN
  -- Check if column exists and is NOT NULL
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'ui_styles' 
    AND column_name = 'element_name'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE ui_styles ALTER COLUMN element_name DROP NOT NULL;
  END IF;
END $$;