/*
  # Create Profiles and Activity Log Tables

  ## New Tables

  1. **profiles**
     - `id` (uuid, primary key, references auth.users)
     - `email` (text, unique, not null)
     - `full_name` (text)
     - `avatar_url` (text)
     - `role` (text, default 'user') - user, admin, super_admin
     - `tenant_id` (uuid, references tenants)
     - `created_at` (timestamptz, default now())
     - `updated_at` (timestamptz, default now())

  2. **activity_log**
     - `id` (uuid, primary key)
     - `user_id` (uuid, references auth.users)
     - `action` (text) - create, update, delete, style_change
     - `table_name` (text)
     - `record_id` (uuid)
     - `changes` (jsonb) - stores before/after values
     - `ip_address` (text)
     - `user_agent` (text)
     - `created_at` (timestamptz, default now())

  ## Security
  - Enable RLS on both tables
  - Users can read/update their own profile
  - Only admins can view activity logs
  - Activity logs are insert-only (no updates/deletes)

  ## Indexes
  - Index on user_id for fast lookups
  - Index on table_name and action for filtering
  - Index on created_at for time-based queries
*/

-- =====================================================
-- CREATE PROFILES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin can update any profile
CREATE POLICY "Admin can update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt()->>'email') = 'admin@modulus.com')
  WITH CHECK ((SELECT auth.jwt()->>'email') = 'admin@modulus.com');

-- =====================================================
-- CREATE ACTIVITY LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete', 'style_change', 'login', 'logout')),
  table_name text,
  record_id uuid,
  changes jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON public.activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_table_name ON public.activity_log(table_name);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity_log
CREATE POLICY "Admin can view all activity logs" ON public.activity_log
  FOR SELECT TO authenticated
  USING ((SELECT auth.jwt()->>'email') = 'admin@modulus.com');

CREATE POLICY "Authenticated users can insert activity logs" ON public.activity_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- CREATE TRIGGER TO AUTO-UPDATE updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CREATE FUNCTION TO AUTO-CREATE PROFILE ON SIGNUP
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SEED ADMIN PROFILE
-- =====================================================

-- Insert admin profile if it doesn't exist
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id,
  email,
  'System Administrator',
  'super_admin'
FROM auth.users
WHERE email = 'admin@modulus.com'
ON CONFLICT (id) DO UPDATE SET role = 'super_admin';