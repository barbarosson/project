-- Admin rolunu kaldir: role = 'admin' olan tum profilleri super_admin yap
UPDATE public.profiles
SET role = 'super_admin'
WHERE role = 'admin';

-- profiles.role CHECK constraint'tan 'admin' kaldir (sadece user, super_admin kabul et)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'super_admin'));
