-- E-Fatura API (NES) belge yüklemesi için SenderAlias (gönderici etiketi) alanı.
-- Örn: urn:mail:defaultgb@nes.com.tr
ALTER TABLE edocument_settings
  ADD COLUMN IF NOT EXISTS sender_alias text DEFAULT '';

COMMENT ON COLUMN edocument_settings.sender_alias IS 'E-Fatura API gönderici etiketi (SenderAlias). NES portalında tanımlı etiket.';
