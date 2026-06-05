-- Fix accept_invitation to use UPSERT on profiles (not just UPDATE).
-- Guarantees church_id is written even if the profile was just created
-- by ensureUserProfile in the same request cycle.
-- Also returns all roles the user now holds (not just the invite role).
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_invite  public.invitations;
  v_user_id uuid;
  v_email   text;
  v_cell    uuid;
  v_roles   text[];
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;

  -- Accept by token OR id, must be pending and not expired
  SELECT * INTO v_invite
  FROM public.invitations
  WHERE (token = p_token OR id = p_token)
    AND status = 'pending'
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Convite inválido, expirado ou já utilizado');
  END IF;

  IF v_invite.church_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Convite sem igreja vinculada');
  END IF;

  -- Fetch the authenticated user's email
  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

  -- UPSERT the profile so church_id is set regardless of whether the profile
  -- already exists. Coalesce to keep any existing data that is more complete.
  INSERT INTO public.profiles (
    user_id, email, full_name,
    church_id, congregation_id, member_id,
    registration_status
  )
  VALUES (
    v_user_id,
    v_email,
    COALESCE(v_invite.full_name, split_part(v_email, '@', 1)),
    v_invite.church_id,
    v_invite.congregation_id,
    v_invite.member_id,
    'aprovado'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    church_id       = EXCLUDED.church_id,
    congregation_id = COALESCE(EXCLUDED.congregation_id, profiles.congregation_id),
    member_id       = COALESCE(EXCLUDED.member_id,       profiles.member_id),
    full_name       = COALESCE(NULLIF(profiles.full_name, ''), EXCLUDED.full_name),
    registration_status = 'aprovado',
    updated_at      = now();

  -- Always assign 'membro' as the base role
  INSERT INTO public.user_roles (user_id, church_id, role)
  VALUES (v_user_id, v_invite.church_id, 'membro')
  ON CONFLICT (user_id, church_id, role) DO NOTHING;

  -- Assign the specific role from the invitation (if different from membro)
  IF v_invite.role IS NOT NULL AND v_invite.role::text <> 'membro' THEN
    INSERT INTO public.user_roles (user_id, church_id, role, permissions)
    VALUES (v_user_id, v_invite.church_id, v_invite.role, v_invite.permissions)
    ON CONFLICT (user_id, church_id, role) DO UPDATE
      SET permissions = EXCLUDED.permissions;
  END IF;

  -- Assign any additional roles from the roles[] array
  IF v_invite.roles IS NOT NULL AND array_length(v_invite.roles, 1) > 0 THEN
    INSERT INTO public.user_roles (user_id, church_id, role)
    SELECT v_user_id, v_invite.church_id, r::public.app_role
    FROM unnest(v_invite.roles) r
    ON CONFLICT (user_id, church_id, role) DO NOTHING;
  END IF;

  -- Link cells if cell_ids are present
  IF v_invite.cell_ids IS NOT NULL AND array_length(v_invite.cell_ids, 1) > 0 THEN
    FOREACH v_cell IN ARRAY v_invite.cell_ids LOOP
      INSERT INTO public.cell_leaders (user_id, cell_id, church_id)
      VALUES (v_user_id, v_cell, v_invite.church_id)
      ON CONFLICT (user_id, cell_id) DO NOTHING;
    END LOOP;
  END IF;

  -- Mark the invitation as used
  UPDATE public.invitations
  SET status = 'accepted', used_at = now()
  WHERE id = v_invite.id;

  -- Return ALL roles the user now holds in this church
  SELECT array_agg(DISTINCT ur.role::text) INTO v_roles
  FROM public.user_roles ur
  WHERE ur.user_id = v_user_id AND ur.church_id = v_invite.church_id;

  RETURN json_build_object(
    'success',   true,
    'church_id', v_invite.church_id,
    'roles',     COALESCE(v_roles, ARRAY[]::text[])
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.accept_invitation(uuid) TO authenticated;
