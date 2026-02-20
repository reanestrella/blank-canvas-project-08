
-- Drop existing accept_invitation function and recreate with correct return type
DROP FUNCTION IF EXISTS public.accept_invitation(uuid);

CREATE OR REPLACE FUNCTION public.accept_invitation(p_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  INSERT INTO public.user_roles (user_id, church_id, role)
  VALUES (v_user_id, v_inv.church_id, v_inv.role::text)
  ON CONFLICT (user_id, church_id) DO UPDATE SET
    role = v_inv.role::text;

  UPDATE public.invitations
  SET used_at = now()
  WHERE id = v_inv.id;

  RETURN json_build_object(
    'success', true,
    'church_id', v_inv.church_id,
    'role', v_inv.role
  );
END;
$$;
