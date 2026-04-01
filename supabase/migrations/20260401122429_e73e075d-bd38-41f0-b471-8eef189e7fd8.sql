ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_linked boolean NOT NULL DEFAULT false;

ALTER TABLE public.pending_users
ADD COLUMN IF NOT EXISTS congregation_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pending_users_congregation_id_fkey'
  ) THEN
    ALTER TABLE public.pending_users
    ADD CONSTRAINT pending_users_congregation_id_fkey
    FOREIGN KEY (congregation_id)
    REFERENCES public.congregations(id)
    ON DELETE SET NULL;
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  BEGIN
    INSERT INTO public.profiles (
      id,
      user_id,
      email,
      full_name,
      church_id,
      congregation_id,
      registration_status,
      is_linked
    )
    VALUES (
      NEW.id,
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
      NULL,
      NULL,
      COALESCE(NEW.raw_user_meta_data->>'registration_status', 'pendente'),
      false
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
      id = EXCLUDED.id,
      email = EXCLUDED.email,
      full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
      registration_status = COALESCE(EXCLUDED.registration_status, public.profiles.registration_status),
      updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$function$;