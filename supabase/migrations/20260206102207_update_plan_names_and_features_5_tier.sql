/*
  # Update subscription plans to 5-tier system

  1. Changes
    - Renamed plan names: SMALL -> KUCUK, MEDIUM -> ORTA, LARGE -> BUYUK
    - Updated user_subscriptions default from STARTER to FREE
    - Migrated existing user_subscriptions with old plan names
    - Updated features list for each plan with comprehensive Turkish descriptions

  2. Plan Tiers
    - FREE (Temel) - 0 TL
    - KUCUK (Kucuk) - 299 TL
    - ORTA (Orta) - 799 TL
    - BUYUK (Buyuk) - 1499 TL
    - ENTERPRISE (Kurumsal) - 2999 TL
*/

UPDATE subscription_plans SET name = 'KUCUK' WHERE name = 'SMALL';
UPDATE subscription_plans SET name = 'ORTA' WHERE name = 'MEDIUM';
UPDATE subscription_plans SET name = 'BUYUK' WHERE name = 'LARGE';

UPDATE user_subscriptions SET plan_name = 'ORTA' WHERE plan_name = 'MEDIUM';
UPDATE user_subscriptions SET plan_name = 'FREE' WHERE plan_name = 'STARTER';
UPDATE user_subscriptions SET plan_name = 'KUCUK' WHERE plan_name = 'ADVANCED';

ALTER TABLE user_subscriptions ALTER COLUMN plan_name SET DEFAULT 'FREE';

UPDATE subscription_plans SET features = ARRAY[
  'Kontrol Paneli',
  '25 Musteri',
  '50 Urun',
  '15 Fatura/Ay',
  'Temel Raporlar',
  'Email Destek',
  '1 Kullanici'
] WHERE name = 'FREE';

UPDATE subscription_plans SET features = ARRAY[
  'Kontrol Paneli',
  '250 Musteri',
  '500 Urun',
  'Sinirsiz Fatura',
  'Gider Yonetimi',
  'Finans Hesaplari',
  'Finans Islemleri',
  'Nakit Akis Grafigi',
  'Stok Takibi',
  'Email Destek',
  '3 Kullanici'
] WHERE name = 'KUCUK';

UPDATE subscription_plans SET features = ARRAY[
  'Sinirsiz Musteri',
  'Sinirsiz Urun',
  'Teklif Yonetimi',
  'Kampanya Yonetimi',
  'Toplu Fatura Olusturma',
  'Toplu Urun Ekleme',
  'Stok Hareketleri',
  'Cok Dovizli Islem',
  'Canli Destek',
  '10 Kullanici'
] WHERE name = 'ORTA';

UPDATE subscription_plans SET features = ARRAY[
  'AI Is Analizleri',
  'Finans Robotu',
  'Nakit Akis Tahminleri',
  'AI Oneri Motoru',
  'E-Fatura Entegrasyonu',
  'E-Arsiv',
  'E-Irsaliye',
  'Mukellef Sorgulama',
  'Oncelikli Destek',
  '25 Kullanici'
] WHERE name = 'BUYUK';

UPDATE subscription_plans SET features = ARRAY[
  'Tum Ozellikler',
  'API Erisimi',
  'Ozel Hesap Yoneticisi',
  '24/7 Premium Destek',
  'Ozel Gelistirme',
  'Egitim ve Danismanlik',
  'SLA Garantisi',
  'Sinirsiz Kullanici'
] WHERE name = 'ENTERPRISE';
