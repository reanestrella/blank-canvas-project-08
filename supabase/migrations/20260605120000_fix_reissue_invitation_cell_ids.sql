-- Fix reissue_invitation to accept cell_ids and permissions directly,
-- eliminating the unreliable two-step UPDATE that silently drops cell assignments.
CREATE OR REPLACE FUNCTION public.reissue_invitation(
  p_church_id      uuid,
  p_email          text,
  p_full_name      text,
  p_role           app_role,
  p_congregation_id uuid DEFAULT NULL,
  p_member_id      uuid DEFAULT NULL,
  p_invited_by     uuid DEFAULT NULL,
  p_cell_ids       uuid[]   DEFAULT NULL,
  p_permissions    text[]   DEFAULT NULL
)
RETURNS invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_inv public.invitations;
BEGIN
  -- Re-issue an existing pending invite for the same email
  IF p_email IS NOT NULL AND p_email <> '' THEN
    UPDATE public.invitations
       SET full_name       = COALESCE(p_full_name, full_name),
           role            = p_role,
           congregation_id = COALESCE(p_congregation_id, congregation_id),
           member_id       = COALESCE(p_member_id, member_id),
           invited_by      = COALESCE(p_invited_by, invited_by),
           cell_ids        = p_cell_ids,
           permissions     = p_permissions,
           token           = gen_random_uuid(),
           expires_at      = now() + interval '7 days',
           used_at         = NULL,
           status          = 'pending'
     WHERE church_id = p_church_id
       AND lower(email) = lower(p_email)
       AND status = 'pending'
     RETURNING * INTO v_inv;

    IF FOUND THEN RETURN v_inv; END IF;
  END IF;

  -- Create a new invite
  INSERT INTO public.invitations (
    church_id, congregation_id, member_id,
    email, full_name, role,
    cell_ids, permissions,
    token, invited_by, expires_at, status
  )
  VALUES (
    p_church_id, p_congregation_id, p_member_id,
    NULLIF(p_email, ''), p_full_name, p_role,
    p_cell_ids, p_permissions,
    gen_random_uuid(), p_invited_by,
    now() + interval '7 days', 'pending'
  )
  RETURNING * INTO v_inv;

  RETURN v_inv;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.reissue_invitation(uuid, text, text, app_role, uuid, uuid, uuid, uuid[], text[]) TO authenticated;
