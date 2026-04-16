DROP FUNCTION IF EXISTS public.accept_invitation(uuid);

CREATE OR REPLACE FUNCTION public.accept_invitation(p_token uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_inv RECORD;
  v_user_id uuid;
  v_roles text[];
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;

  SELECT *
  INTO v_inv
  FROM public.invitations
  WHERE token = p_token;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Token de convite não encontrado');
  END IF;

  IF v_inv.used_at IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Este convite já foi utilizado');
  END IF;

  IF v_inv.expires_at < now() THEN
    RETURN json_build_object('success', false, 'error', 'Este convite expirou. Solicite um novo convite.');
  END IF;

  INSERT INTO public.profiles (user_id, church_id, member_id, congregation_id)
  VALUES (v_user_id, v_inv.church_id, v_inv.member_id, v_inv.congregation_id)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    church_id = EXCLUDED.church_id,
    member_id = COALESCE(EXCLUDED.member_id, profiles.member_id),
    congregation_id = COALESCE(EXCLUDED.congregation_id, profiles.congregation_id);

  INSERT INTO public.user_roles (user_id, church_id, role)
  VALUES (v_user_id, v_inv.church_id, 'membro')
  ON CONFLICT (user_id, church_id, role) DO NOTHING;

  IF v_inv.role IS NOT NULL AND v_inv.role::text <> 'membro' THEN
    INSERT INTO public.user_roles (user_id, church_id, role)
    VALUES (v_user_id, v_inv.church_id, v_inv.role)
    ON CONFLICT (user_id, church_id, role) DO NOTHING;
  END IF;

  UPDATE public.invitations
  SET used_at = now()
  WHERE token = p_token;

  SELECT array_agg(ur.role::text)
  INTO v_roles
  FROM public.user_roles ur
  WHERE ur.user_id = v_user_id
    AND ur.church_id = v_inv.church_id;

  RETURN json_build_object(
    'success', true,
    'church_id', v_inv.church_id,
    'roles', COALESCE(v_roles, ARRAY[]::text[])
  );
END;
$function$;