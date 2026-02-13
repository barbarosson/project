/*
  # Add WhatsApp Support to Site Configuration

  1. Changes
    - Add `whatsapp_number` column to `site_config` table for WhatsApp Business number
    - Add `whatsapp_enabled` column to enable/disable WhatsApp support feature
  
  2. Notes
    - WhatsApp number should be in international format (e.g., +905551234567)
    - When enabled, users will see WhatsApp contact option in support widget
*/

DO $$ BEGIN
  -- Add WhatsApp number column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_config' AND column_name = 'whatsapp_number'
  ) THEN
    ALTER TABLE site_config ADD COLUMN whatsapp_number text;
  END IF;

  -- Add WhatsApp enabled flag if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_config' AND column_name = 'whatsapp_enabled'
  ) THEN
    ALTER TABLE site_config ADD COLUMN whatsapp_enabled boolean DEFAULT false;
  END IF;
END $$;

-- Set default WhatsApp number for existing configuration
UPDATE site_config 
SET whatsapp_number = '+905551234567',
    whatsapp_enabled = true
WHERE whatsapp_number IS NULL;
