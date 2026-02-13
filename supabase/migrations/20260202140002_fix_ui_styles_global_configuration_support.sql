/*
  # Fix ui_styles to Support Both Element-Specific and Global Configuration
  
  ## Summary
  The ui_styles table is used for two purposes:
  1. Element-specific styles (element_name, property, value, unit, category, label)
  2. Global UI configuration (logo_width, primary_color, background_pattern, etc.)
  
  This migration makes element-specific columns nullable to support global configuration rows.
  
  ## Changes
  
  1. **Modified Columns - Made Nullable**
     - `value` → nullable (was NOT NULL)
     - `unit` → nullable (was NOT NULL with default 'px')
     - `category` → nullable (was NOT NULL)
     - `label` → nullable (was NOT NULL)
  
  2. **Reasoning**
     - Visual Styles Controller manages global styles without using element-specific fields
     - Element-specific styles still work when these fields are populated
     - Global configuration rows can exist with only global columns populated
  
  ## Use Cases Supported
  - ✅ Element-specific styles: element_name='header', property='padding', value=20, unit='px'
  - ✅ Global configuration: logo_width=180, primary_color='#3b82f6', background_pattern='/patterns/dots.svg'
  
  ## Notes
  - No data loss - only constraint relaxation
  - Existing element-specific styles remain unaffected
  - Global configuration can now be saved without errors
*/

-- Make element-specific columns nullable to support global configuration
DO $$
BEGIN
  -- Make value column nullable
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'ui_styles' 
    AND column_name = 'value'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE ui_styles ALTER COLUMN value DROP NOT NULL;
  END IF;

  -- Make unit column nullable
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'ui_styles' 
    AND column_name = 'unit'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE ui_styles ALTER COLUMN unit DROP NOT NULL;
  END IF;

  -- Make category column nullable
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'ui_styles' 
    AND column_name = 'category'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE ui_styles ALTER COLUMN category DROP NOT NULL;
  END IF;

  -- Make label column nullable
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'ui_styles' 
    AND column_name = 'label'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE ui_styles ALTER COLUMN label DROP NOT NULL;
  END IF;
END $$;

-- Add a comment explaining the dual purpose of this table
COMMENT ON TABLE ui_styles IS 'Stores both element-specific CSS styles and global UI configuration. Element-specific rows use element_name/property/value/unit. Global config rows use logo_width/primary_color/etc.';