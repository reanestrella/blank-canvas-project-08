
-- Corrige a função accept_invitation para realmente aceitar convites da tabela invitations
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_invite public.invitations;
  v_user_id uuid;
  v_user_email text;
  v_roles text[];
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;

  -- Buscar convite por id OU token, status pendente, não expirado
  SELECT *
    INTO v_invite
    FROM public.invitations
   WHERE (id = p_token OR token = p_token)
     AND status = 'pending'
     AND (expires_at IS NULL OR expires_at > now())
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Convite inválido, expirado ou já utilizado');
  END IF;

  IF v_invite.church_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Convite sem igreja vinculada');
  END IF;

  -- Pega email do usuário autenticado
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  -- Vincula o profile do usuário à igreja/congregação do convite
  INSERT INTO public.profiles (id, user_id, email, full_name, church_id, congregation_id, member_id, is_linked, registration_status)
  VALUES (
    v_user_id,
    v_user_id,
    v_user_email,
    COALESCE(v_invite.full_name, split_part(v_user_email, '@', 1)),
    v_invite.church_id,
    v_invite.congregation_id,
    v_invite.member_id,
    true,
    'aprovado'
  )
  ON CONFLICT (user_id) DO UPDATE
    SET church_id = EXCLUDED.church_id,
        congregation_id = COALESCE(EXCLUDED.congregation_id, public.profiles.congregation_id),
        member_id = COALESCE(EXCLUDED.member_id, public.profiles.member_id),
        full_name = COALESCE(NULLIF(public.profiles.full_name, ''), EXCLUDED.full_name),
        is_linked = true,
        registration_status = 'aprovado',
        updated_at = now();

  -- Atribui o role do convite
  INSERT INTO public.user_roles (user_id, church_id, role)
  VALUES (v_user_id, v_invite.church_id, v_invite.role)
  ON CONFLICT (user_id, church_id, role) DO NOTHING;

  -- Atribui também roles adicionais se houver
  IF v_invite.roles IS NOT NULL AND array_length(v_invite.roles, 1) > 0 THEN
    INSERT INTO public.user_roles (user_id, church_id, role)
    SELECT v_user_id, v_invite.church_id, r::public.app_role
      FROM unnest(v_invite.roles) r
    ON CONFLICT (user_id, church_id, role) DO NOTHING;
  END IF;

  -- Marca convite como aceito
  UPDATE public.invitations
     SET status = 'accepted', used_at = now()
   WHERE id = v_invite.id;

  -- Retorna roles do usuário para redirecionamento
  SELECT array_agg(role::text)
    INTO v_roles
    FROM public.user_roles
   WHERE user_id = v_user_id AND church_id = v_invite.church_id;

  RETURN json_build_object(
    'success', true,
    'church_id', v_invite.church_id,
    'roles', COALESCE(v_roles, ARRAY[]::text[])
  );
END;
$function$;

-- Permite usuários autenticados executarem
GRANT EXECUTE ON FUNCTION public.accept_invitation(uuid) TO authenticated;
