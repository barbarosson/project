/*
  # Update Subscription Plans Features

  1. Updates
    - Update existing subscription plans with correct feature lists
    - Ensure pricing is consistent
    
  2. Changes
    - STARTER: Basic features for small businesses
    - ADVANCED: Additional features including Proposals, Campaigns, AI Chat, Live Support
    - ENTERPRISE: All features including E-Invoice and 24/7 Support
*/

-- Update STARTER plan
UPDATE subscription_plans
SET 
  description = 'Perfect for small businesses',
  price_tl = 650,
  monthly_price = 650,
  features = ARRAY[
    'Cari Yönetimi',
    'Ürün ve Hizmetler',
    'Faturalar',
    'Giderler',
    'Finans',
    'Email Destek'
  ]::text[]
WHERE name = 'STARTER';

-- Update ADVANCED plan
UPDATE subscription_plans
SET 
  description = 'Best for growing companies',
  price_tl = 1750,
  monthly_price = 1750,
  features = ARRAY[
    'Başlangıç Planındaki Her Şey',
    'Teklif Yönetimi',
    'Kampanya Yönetimi',
    'Modulus AI',
    'Canlı Destek'
  ]::text[]
WHERE name = 'ADVANCED';

-- Update ENTERPRISE plan
UPDATE subscription_plans
SET 
  description = 'Complete solution for large organizations',
  price_tl = 4250,
  monthly_price = 4250,
  features = ARRAY[
    'Gelişmiş Planındaki Her Şey',
    'E-Fatura Entegrasyonu',
    '24/7 Premium Destek',
    'Özel Entegrasyon',
    'Özel Hesap Yöneticisi'
  ]::text[]
WHERE name = 'ENTERPRISE';