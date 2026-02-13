/*
  # Sync plan_tier values with plan names

  1. Changes
    - Updated plan_tier column to match plan name (lowercase)
    - free, kucuk, orta, buyuk, enterprise
    - Ensures consistency between name and plan_tier fields
*/

UPDATE subscription_plans SET plan_tier = 'free' WHERE name = 'FREE';
UPDATE subscription_plans SET plan_tier = 'kucuk' WHERE name = 'KUCUK';
UPDATE subscription_plans SET plan_tier = 'orta' WHERE name = 'ORTA';
UPDATE subscription_plans SET plan_tier = 'buyuk' WHERE name = 'BUYUK';
UPDATE subscription_plans SET plan_tier = 'enterprise' WHERE name = 'ENTERPRISE';
