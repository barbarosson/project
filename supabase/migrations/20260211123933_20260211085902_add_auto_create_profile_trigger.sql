/*
  # Auto-Create Profile Trigger

  1. Purpose
    - Automatically creates profile and tenant when a new user signs up
    - Prevents authentication errors from missing profiles
    - Ensures data consistency

  2. Implementation
    - Trigger function on auth.users INSERT
    - Creates tenant with user as owner
    - Creates profile linked to tenant
    - Uses SECURITY DEFINER for permission elevation

  3. Benefits
    - No manual profile creation needed
    - Prevents "Database error querying schema" auth errors
    - Maintains referential integrity
*/

-- Create function to auto-create profile and tenant
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create tenant first
  INSERT INTO public.tenants (id, name, owner_id)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Company'), NEW.id)
  ON CONFLICT (id) DO NOTHING;
  
  -- Create profile
  INSERT INTO public.profiles (id, tenant_id, full_name, role)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT INSERT ON public.tenants TO supabase_auth_admin;
GRANT INSERT ON public.profiles TO supabase_auth_admin;