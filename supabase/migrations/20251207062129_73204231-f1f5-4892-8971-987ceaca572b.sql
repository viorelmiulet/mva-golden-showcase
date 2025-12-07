-- Remove the role check constraint from profiles since roles are now in user_roles table
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Update the handle_new_user function to not include role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, phone)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$$;