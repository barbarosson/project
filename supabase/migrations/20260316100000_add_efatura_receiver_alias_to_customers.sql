-- Alıcı Etiket (Receiver Alias): E-fatura portalında alıcı tarafın etiketi (örn. urn:mail:alici@...).
-- Gönderim sırasında NES/GIB'e ReceiverAlias olarak iletilir; boş bırakılırsa portanda manuel güncelleme gerekir.
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS efatura_receiver_alias text;

COMMENT ON COLUMN customers.efatura_receiver_alias IS 'E-fatura alıcı etiketi (ReceiverAlias). NES portalında alıcı için tanımlı etiket (örn. urn:mail:...).';
