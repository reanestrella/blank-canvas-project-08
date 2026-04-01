ALTER TABLE public.pending_users
ADD COLUMN IF NOT EXISTS user_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pending_users_user_id_key'
  ) THEN
    ALTER TABLE public.pending_users
    ADD CONSTRAINT pending_users_user_id_key UNIQUE (user_id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_pending_users_church_status
ON public.pending_users (church_id, status);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_church_id uuid;
  v_congregation_id uuid;
  v_registration_status text;
  v_full_name text;
  v_phone text;
  v_birth_date date;
  v_tipo text;
BEGIN
  BEGIN
    v_church_id := NULLIF(TRIM(NEW.raw_user_meta_data->>'church_id'), '')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    v_church_id := NULL;
  END;

  BEGIN
    v_congregation_id := NULLIF(TRIM(NEW.raw_user_meta_data->>'congregation_id'), '')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    v_congregation_id := NULL;
  END;

  BEGIN
    v_birth_date := NULLIF(TRIM(NEW.raw_user_meta_data->>'birth_date'), '')::date;
  EXCEPTION WHEN others THEN
    v_birth_date := NULL;
  END;

  IF v_church_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.churches c WHERE c.id = v_church_id
  ) THEN
    v_church_id := NULL;
    v_congregation_id := NULL;
  END IF;

  IF v_congregation_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.congregations cg
    WHERE cg.id = v_congregation_id
      AND cg.church_id = v_church_id
  ) THEN
    v_congregation_id := NULL;
  END IF;

  v_registration_status := COALESCE(NULLIF(NEW.raw_user_meta_data->>'registration_status', ''), 'pendente');
  v_full_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    SPLIT_PART(COALESCE(NEW.email, ''), '@', 1),
    'Usuário'
  );
  v_phone := NULLIF(NEW.raw_user_meta_data->>'phone', '');
  v_tipo := COALESCE(NULLIF(NEW.raw_user_meta_data->>'tipo', ''), 'visitante');

  INSERT INTO public.profiles (
    id,
    user_id,
    email,
    full_name,
    phone,
    church_id,
    congregation_id,
    registration_status,
    is_linked
  )
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    v_full_name,
    v_phone,
    v_church_id,
    v_congregation_id,
    v_registration_status,
    false
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    id = EXCLUDED.id,
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    church_id = COALESCE(public.profiles.church_id, EXCLUDED.church_id),
    congregation_id = COALESCE(public.profiles.congregation_id, EXCLUDED.congregation_id),
    registration_status = COALESCE(EXCLUDED.registration_status, public.profiles.registration_status),
    updated_at = now();

  IF v_church_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, church_id, role)
    VALUES (NEW.id, v_church_id, 'membro')
    ON CONFLICT (user_id, church_id, role) DO NOTHING;

    INSERT INTO public.pending_users (
      user_id,
      full_name,
      email,
      phone,
      birth_date,
      church_id,
      congregation_id,
      tipo,
      status
    )
    VALUES (
      NEW.id,
      v_full_name,
      NEW.email,
      v_phone,
      v_birth_date,
      v_church_id,
      v_congregation_id,
      v_tipo,
      'pendente'
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      phone = COALESCE(EXCLUDED.phone, public.pending_users.phone),
      birth_date = COALESCE(EXCLUDED.birth_date, public.pending_users.birth_date),
      church_id = COALESCE(public.pending_users.church_id, EXCLUDED.church_id),
      congregation_id = COALESCE(public.pending_users.congregation_id, EXCLUDED.congregation_id),
      tipo = COALESCE(EXCLUDED.tipo, public.pending_users.tipo),
      status = CASE
        WHEN public.pending_users.status = 'aprovado' THEN public.pending_users.status
        ELSE EXCLUDED.status
      END;
  END IF;

  RETURN NEW;
EXCEPTION WHEN others THEN
  RETURN NEW;
END;
$function$;