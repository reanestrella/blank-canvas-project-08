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

  -- Aceita p_token como ID do convite (ou token, para compatibilidade)
  SELECT * INTO v_inv FROM public.invitations WHERE id = p_token OR token = p_token LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Convite não encontrado');
  END IF;

  IF v_inv.status = 'accepted' THEN
    RETURN json_build_object('success', false, 'error', 'Este convite já foi utilizado');
  END IF;

  IF v_inv.status = 'expired' OR (v_inv.expires_at IS NOT NULL AND v_inv.expires_at < now()) THEN
    UPDATE public.invitations SET status = 'expired' WHERE id = v_inv.id AND status = 'pending';
    RETURN json_build_object('success', false, 'error', 'Este convite expirou. Solicite um novo convite.');
  END IF;

  IF v_inv.status <> 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Convite inválido');
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

  UPDATE public.invitations SET status = 'accepted', used_at = now() WHERE id = v_inv.id;

  SELECT array_agg(ur.role::text) INTO v_roles
  FROM public.user_roles ur
  WHERE ur.user_id = v_user_id AND ur.church_id = v_inv.church_id;

  RETURN json_build_object('success', true, 'church_id', v_inv.church_id, 'roles', COALESCE(v_roles, ARRAY[]::text[]));
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_invitation(p_token uuid)
 RETURNS TABLE(id uuid, church_id uuid, congregation_id uuid, member_id uuid, email text, full_name text, role app_role, expires_at timestamp with time zone, used_at timestamp with time zone, status text)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT i.id, i.church_id, i.congregation_id, i.member_id, i.email, i.full_name, i.role, i.expires_at, i.used_at, i.status
  FROM public.invitations i
  WHERE (i.id = p_token OR i.token = p_token)
    AND i.status = 'pending'
    AND (i.expires_at IS NULL OR i.expires_at > now())
  LIMIT 1;
$function$;