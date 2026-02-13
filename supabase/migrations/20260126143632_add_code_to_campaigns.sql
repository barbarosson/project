/*
  # Add code field to campaigns table
  
  1. Changes
    - Add `code` column to campaigns table for auto-generated campaign codes
    - Add unique constraint on code field
*/

-- Add code column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'code'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN code text UNIQUE;
  END IF;
END $$;

-- Create function to generate campaign code
CREATE OR REPLACE FUNCTION generate_campaign_code()
RETURNS text AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate code: CAM-YYYYMMDD-XXXX (e.g., CAM-20260126-A1B2)
    new_code := 'CAM-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 4));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM campaigns WHERE code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate campaign code
CREATE OR REPLACE FUNCTION set_campaign_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL THEN
    NEW.code := generate_campaign_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_set_campaign_code ON campaigns;
CREATE TRIGGER trigger_set_campaign_code
BEFORE INSERT ON campaigns
FOR EACH ROW
EXECUTE FUNCTION set_campaign_code();
