
-- 1. Schema changes
ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

ALTER TABLE public.invitations ALTER COLUMN email DROP NOT NULL;

-- Backfill
UPDATE public.invitations SET status = 'accepted' WHERE used_at IS NOT NULL;
UPDATE public.invitations SET status = 'expired' WHERE used_at IS NULL AND expires_at < now();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);

-- 2. Drop all functions that need signature changes FIRST
DROP FUNCTION IF EXISTS public.validate_invitation(uuid);
DROP FUNCTION IF EXISTS public.accept_invitation(uuid);
DROP FUNCTION IF EXISTS public.mark_invitation_used(uuid);
DROP FUNCTION IF EXISTS public.reissue_invitation(uuid, text, text, app_role, uuid, uuid, uuid);

-- 3. Recreate functions

CREATE OR REPLACE FUNCTION public.validate_invitation(p_token uuid)
 RETURNS TABLE(id uuid, church_id uuid, congregation_id uuid, member_id uuid, email text, full_name text, role app_role, expires_at timestamp with time zone, used_at timestamp with time zone, status text)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT i.id, i.church_id, i.congregation_id, i.member_id, i.email, i.full_name, i.role, i.expires_at, i.used_at, i.status
  FROM public.invitations i
  WHERE i.token = p_token
    AND i.status = 'pending'
    AND (i.expires_at IS NULL OR i.expires_at > now())
  LIMIT 1;
$function$;

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

  SELECT * INTO v_inv FROM public.invitations WHERE token = p_token;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Convite não encontrado');
  END IF;

  IF v_inv.status = 'accepted' THEN
    RETURN json_build_object('success', false, 'error', 'Este convite já foi utilizado');
  END IF;

  IF v_inv.status = 'expired' OR (v_inv.expires_at IS NOT NULL AND v_inv.expires_at < now()) THEN
    UPDATE public.invitations SET status = 'expired' WHERE token = p_token AND status = 'pending';
    RETURN json_build_object('success', false, 'error', 'Este convite expirou. Solicite um novo convite.');
  END IF;

  IF v_inv.status <> 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Convite inválido');
  END IF;

  -- Update profile
  INSERT INTO public.profiles (user_id, church_id, member_id, congregation_id)
  VALUES (v_user_id, v_inv.church_id, v_inv.member_id, v_inv.congregation_id)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    church_id = EXCLUDED.church_id,
    member_id = COALESCE(EXCLUDED.member_id, profiles.member_id),
    congregation_id = COALESCE(EXCLUDED.congregation_id, profiles.congregation_id);

  -- Assign roles
  INSERT INTO public.user_roles (user_id, church_id, role)
  VALUES (v_user_id, v_inv.church_id, 'membro')
  ON CONFLICT (user_id, church_id, role) DO NOTHING;

  IF v_inv.role IS NOT NULL AND v_inv.role::text <> 'membro' THEN
    INSERT INTO public.user_roles (user_id, church_id, role)
    VALUES (v_user_id, v_inv.church_id, v_inv.role)
    ON CONFLICT (user_id, church_id, role) DO NOTHING;
  END IF;

  -- Mark accepted
  UPDATE public.invitations SET status = 'accepted', used_at = now() WHERE token = p_token;

  SELECT array_agg(ur.role::text) INTO v_roles
  FROM public.user_roles ur
  WHERE ur.user_id = v_user_id AND ur.church_id = v_inv.church_id;

  RETURN json_build_object('success', true, 'church_id', v_inv.church_id, 'roles', COALESCE(v_roles, ARRAY[]::text[]));
END;
$function$;

CREATE OR REPLACE FUNCTION public.reissue_invitation(
  p_church_id uuid, p_email text, p_full_name text, p_role app_role, 
  p_congregation_id uuid DEFAULT NULL, p_member_id uuid DEFAULT NULL, p_invited_by uuid DEFAULT NULL
)
 RETURNS invitations
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_inv public.invitations;
BEGIN
  IF p_email IS NOT NULL AND p_email <> '' THEN
    UPDATE public.invitations
       SET full_name = COALESCE(p_full_name, full_name),
           role = p_role,
           congregation_id = COALESCE(p_congregation_id, congregation_id),
           member_id = COALESCE(p_member_id, member_id),
           invited_by = COALESCE(p_invited_by, invited_by),
           token = gen_random_uuid(),
           expires_at = now() + interval '7 days',
           used_at = NULL,
           status = 'pending'
     WHERE church_id = p_church_id
       AND lower(email) = lower(p_email)
       AND status = 'pending'
     RETURNING * INTO v_inv;

    IF FOUND THEN RETURN v_inv; END IF;
  END IF;

  INSERT INTO public.invitations (
    church_id, congregation_id, member_id,
    email, full_name, role, token, invited_by, expires_at, status
  )
  VALUES (
    p_church_id, p_congregation_id, p_member_id,
    NULLIF(p_email, ''), p_full_name, p_role, gen_random_uuid(), p_invited_by,
    now() + interval '7 days', 'pending'
  )
  RETURNING * INTO v_inv;

  RETURN v_inv;
END;
$function$;

CREATE OR REPLACE FUNCTION public.mark_invitation_used(p_token uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  UPDATE public.invitations
     SET used_at = now(), status = 'accepted'
   WHERE token = p_token AND status = 'pending';
$function$;

-- 4. RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Church admins can manage invitations"
ON public.invitations FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.church_id = invitations.church_id AND ur.role IN ('pastor'::app_role, 'secretario'::app_role))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.church_id = invitations.church_id AND ur.role IN ('pastor'::app_role, 'secretario'::app_role))
);
