/*
  # Add User Management Fields to Profiles

  1. Modified Tables
    - `profiles`
      - `is_active` (boolean, default true) - Whether the user account is active
      - `last_sign_in_at` (timestamptz, nullable) - Last login timestamp
      - `phone` (text, nullable) - User phone number
      - `company_name` (text, nullable) - User's company name

  2. Security
    - Existing RLS policies remain in effect
    - New columns inherit existing row-level security

  3. Notes
    - is_active defaults to true so existing users remain active
    - These fields support the admin user management interface
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_active boolean NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_sign_in_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_sign_in_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN company_name text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
