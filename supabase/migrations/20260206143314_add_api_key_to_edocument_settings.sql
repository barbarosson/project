/*
  # Add API Key field to edocument_settings

  1. Changes
    - Add `api_key` column to `edocument_settings` table for NES Bilgi Persisted Access Token
    - NES Bilgi uses OAuth 2.0 with Reference tokens (not JWT)
    - API key is generated from NES Portal and used directly as Bearer token
    - Username/password login is no longer needed

  2. Notes
    - The api_key column stores the Persisted Access Token from NES Portal
    - Format example: 9EE05B6564525810C86A32646DB46A26E20F4BCE32C0B13AB22AA78E70DC4F69
    - Sent as Authorization: Bearer {API_KEY} in API requests
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'edocument_settings' AND column_name = 'api_key'
  ) THEN
    ALTER TABLE edocument_settings ADD COLUMN api_key text NOT NULL DEFAULT '';
  END IF;
END $$;
