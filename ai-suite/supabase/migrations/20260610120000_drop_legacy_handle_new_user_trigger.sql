-- Legacy public.handle_new_user() (old tenant/profile template) ran on every auth.users
-- INSERT and wrote public.profiles without the required email column. Signup then failed
-- with GoTrue's misleading "Unable to validate email address: invalid format".

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP FUNCTION IF EXISTS public.handle_new_user();
