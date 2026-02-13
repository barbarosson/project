/*
  # Fix Site Config Single Row Constraint

  ## Changes
  
  Ensure site_config table can only have one configuration row:
  
  1. **Cleanup**
    - Remove duplicate rows (keep only the main config)
    - Ensure the ID is fixed to prevent multiple configs
  
  2. **Constraint**
    - Add a check constraint to ensure only one row exists
    - Add a unique constraint on the key column

  ## Notes
  - This prevents accidental creation of multiple config rows
  - The single config row approach is intentional for this table
*/

-- Ensure only one row exists (cleanup in case of duplicates)
DELETE FROM site_config 
WHERE id != '00000000-0000-0000-0000-000000000001';

-- Make sure key column has a unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'site_config_key_unique'
  ) THEN
    ALTER TABLE site_config ADD CONSTRAINT site_config_key_unique UNIQUE (key);
  END IF;
END $$;

-- Create a function to prevent multiple config rows
CREATE OR REPLACE FUNCTION prevent_multiple_site_configs()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM site_config) >= 1 AND TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'Only one site configuration is allowed. Please update the existing configuration instead.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS enforce_single_site_config ON site_config;

-- Create trigger to enforce single row
CREATE TRIGGER enforce_single_site_config
  BEFORE INSERT ON site_config
  FOR EACH ROW
  EXECUTE FUNCTION prevent_multiple_site_configs();
