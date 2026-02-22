-- Fix accept_invitation to also set member_id and congregation_id from invitation
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_inv RECORD;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT *
  INTO v_inv
  FROM public.invitations
  WHERE token = p_token
    AND used_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Convite inválido ou já utilizado';
  END IF;

  INSERT INTO public.profiles (user_id, church_id, member_id, congregation_id)
  VALUES (v_user_id, v_inv.church_id, v_inv.member_id, v_inv.congregation_id)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    church_id = EXCLUDED.church_id,
    member_id = COALESCE(EXCLUDED.member_id, profiles.member_id),
    congregation_id = COALESCE(EXCLUDED.congregation_id, profiles.congregation_id);

  -- papel base correto:
  INSERT INTO public.user_roles (user_id, church_id, role)
  VALUES (v_user_id, v_inv.church_id, 'membro')
  ON CONFLICT DO NOTHING;

  IF v_inv.role IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, church_id, role)
    VALUES (v_user_id, v_inv.church_id, v_inv.role)
    ON CONFLICT DO NOTHING;
  END IF;

  UPDATE public.invitations
  SET used_at = now()
  WHERE token = p_token;
END;
$function$;