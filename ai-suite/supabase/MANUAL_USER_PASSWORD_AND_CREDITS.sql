-- =============================================================================
-- Manuel: kullanıcı şifresi (auth) + isendai kontör
-- Supabase Dashboard → SQL Editor → tek seferde veya adım adım çalıştırın.
-- Gerekli rol: postgres (Dashboard varsayılanı uygundur).
--
-- Aşağıdaki 'REPLACE_*' değerlerini düzenleyin.
-- =============================================================================

-- Güvenlik: bu dosyayı repoya gerçek şifre ile commit etmeyin.

-- -----------------------------------------------------------------------------
-- 0) İsteğe bağlı: e-posta ile kullanıcı UUID doğrula
-- -----------------------------------------------------------------------------
-- SELECT id, email, created_at FROM auth.users WHERE email = 'REPLACE_EMAIL';

-- -----------------------------------------------------------------------------
-- 1) Şifre güncelleme (bcrypt — pgcrypto)
-- -----------------------------------------------------------------------------
-- Hosted Supabase'te genelde `extensions` şemasında gelir. Hata alırsanız:
--   CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

UPDATE auth.users
SET
  encrypted_password = extensions.crypt('REPLACE_NEW_PASSWORD', extensions.gen_salt('bf')),
  updated_at = now()
WHERE email = 'REPLACE_EMAIL';

-- Etkilenen satır 1 olmalı:
-- SELECT email FROM auth.users WHERE email = 'REPLACE_EMAIL';

-- -----------------------------------------------------------------------------
-- 2) Kontör satırı yoksa oluştur (idempotent), sonra kontör ekle
-- -----------------------------------------------------------------------------
-- owner_id = auth.users.id metin olarak (UUID string).

SELECT public.ensure_entitlement(
  'user',
  (SELECT id::text FROM auth.users WHERE email = 'REPLACE_EMAIL' LIMIT 1),
  0,     -- satır yoksa başlangıç kredi (genelde 0)
  5      -- max_versions_per_request (uygulamanızdaki varsayılanla uyumlu tutun)
);

SELECT public.add_credits(
  'user',
  (SELECT id::text FROM auth.users WHERE email = 'REPLACE_EMAIL' LIMIT 1),
  100  -- <<< buraya eklenecek kontör miktarını yazın (tam sayı)
);

-- Güncel bakiye:
-- SELECT owner_type, owner_id, credits_balance, max_versions_per_request
-- FROM isendai.entitlements
-- WHERE owner_type = 'user' AND owner_id = (SELECT id::text FROM auth.users WHERE email = 'REPLACE_EMAIL' LIMIT 1);
