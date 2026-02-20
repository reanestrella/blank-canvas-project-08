
-- Step 1: Drop the existing unique constraint on (user_id, church_id) so users can have multiple roles
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_church_id_key;

-- Step 2: Add new unique constraint on (user_id, church_id, role) to prevent duplicate role entries
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_church_id_role_key UNIQUE (user_id, church_id, role);

-- Step 3: Update accept_invitation to INSERT without conflicting on the old constraint
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_inv record;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não autenticado.');
  END IF;

  SELECT * INTO v_inv
  FROM public.invitations
  WHERE token = p_token
    AND used_at IS NULL
    AND expires_at > now()
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Convite inválido, expirado ou já utilizado.');
  END IF;

  -- Upsert profile
  INSERT INTO public.profiles (user_id, church_id, full_name, email, congregation_id, member_id)
  VALUES (
    v_user_id,
    v_inv.church_id,
    COALESCE(v_inv.full_name, 'Usuário'),
    v_inv.email,
    v_inv.congregation_id,
    v_inv.member_id
  )
  ON CONFLICT (user_id) DO UPDATE SET
    church_id = v_inv.church_id,
    congregation_id = COALESCE(v_inv.congregation_id, profiles.congregation_id),
    member_id = COALESCE(v_inv.member_id, profiles.member_id),
    updated_at = now();

  -- Insert role (now supports multiple roles per user per church)
  INSERT INTO public.user_roles (user_id, church_id, role)
  VALUES (v_user_id, v_inv.church_id, v_inv.role::text)
  ON CONFLICT (user_id, church_id, role) DO NOTHING;

  -- Mark invitation as used
  UPDATE public.invitations
  SET used_at = now()
  WHERE id = v_inv.id;

  RETURN json_build_object(
    'success', true,
    'church_id', v_inv.church_id,
    'role', v_inv.role
  );
END;
$function$;

-- Step 4: Update handle_new_user to use new constraint
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_church_id uuid;
begin
  insert into public.churches (name, created_at)
  values (
    coalesce(new.raw_user_meta_data->>'church_name', 'Nova Igreja'),
    now()
  )
  returning id into v_church_id;

  insert into public.profiles (
    id, user_id, church_id, full_name, created_at, updated_at
  )
  values (
    gen_random_uuid(),
    new.id,
    v_church_id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Administrador'),
    now(), now()
  )
  on conflict (user_id)
  do update set church_id = excluded.church_id, updated_at = now();

  insert into public.user_roles (user_id, church_id, role)
  values (new.id, v_church_id, 'admin')
  on conflict (user_id, church_id, role) do nothing;

  return new;
end;
$function$;

-- Step 5: Update setup_new_church to use new constraint
CREATE OR REPLACE FUNCTION public.setup_new_church(_church_name text, _email text, _full_name text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_church_id uuid;
begin
  select id into v_user_id
  from auth.users
  where lower(email) = lower(_email)
  limit 1;

  if v_user_id is null then
    return json_build_object('success', false, 'error', 'user not found');
  end if;

  insert into public.churches (name)
  values (_church_name)
  returning id into v_church_id;

  insert into public.profiles (user_id, church_id, full_name)
  values (v_user_id, v_church_id, _full_name)
  on conflict (user_id)
  do update set church_id = excluded.church_id;

  insert into public.user_roles (user_id, church_id, role)
  values (v_user_id, v_church_id, 'admin')
  on conflict (user_id, church_id, role) do nothing;

  return json_build_object('success', true, 'church_id', v_church_id);
end;
$function$;

-- Step 6: Update assign_user_role to use new constraint  
CREATE OR REPLACE FUNCTION public.assign_user_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  user_count integer;
begin
  select count(*)
  into user_count
  from public.profiles
  where church_id = new.church_id;

  if user_count = 1 then
    insert into public.user_roles (user_id, church_id, role)
    values (new.user_id, new.church_id, 'admin')
    on conflict (user_id, church_id, role) do nothing;
  else
    insert into public.user_roles (user_id, church_id, role)
    values (new.user_id, new.church_id, 'member')
    on conflict (user_id, church_id, role) do nothing;
  end if;

  return new;
end;
$function$;
