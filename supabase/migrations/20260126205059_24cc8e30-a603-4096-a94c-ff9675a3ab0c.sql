-- Atualizar a função de registro para incluir member_id
-- Quando um líder é convidado, podemos vincular ao membro pelo email ou nome

CREATE OR REPLACE FUNCTION public.register_invited_user(_invitation_token uuid, _user_id uuid, _full_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _invitation RECORD;
  _member_id uuid;
BEGIN
  -- Validate invitation
  SELECT * INTO _invitation
  FROM invitations
  WHERE token = _invitation_token
    AND used_at IS NULL
    AND expires_at > now();
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Convite inválido ou expirado';
  END IF;

  -- Try to find a matching member by email in the same church
  SELECT id INTO _member_id
  FROM members
  WHERE church_id = _invitation.church_id
    AND email = _invitation.email
  LIMIT 1;

  -- Create profile with member_id if found
  INSERT INTO profiles (user_id, church_id, full_name, email, congregation_id, member_id)
  VALUES (
    _user_id, 
    _invitation.church_id, 
    _full_name, 
    _invitation.email,
    _invitation.congregation_id,
    _member_id
  );

  -- Assign role
  INSERT INTO user_roles (user_id, church_id, role)
  VALUES (_user_id, _invitation.church_id, _invitation.role);

  -- Mark invitation as used
  UPDATE invitations 
  SET used_at = now() 
  WHERE id = _invitation.id;
END;
$$;

-- Também preciso corrigir a RLS de cells - existem 2 policies conflitantes
-- Vou dropar a policy antiga e manter apenas uma consistente
DROP POLICY IF EXISTS "Células visíveis para igreja" ON public.cells;
DROP POLICY IF EXISTS "Líder de célula pode ver sua célula" ON public.cells;
DROP POLICY IF EXISTS "Admin e consolidacao pode ver todas células" ON public.cells;

-- Uma única policy para SELECT em cells
CREATE POLICY "Células visíveis por role"
  ON public.cells FOR SELECT
  USING (
    church_id = get_user_church_id(auth.uid()) AND (
      is_church_admin(auth.uid(), church_id) OR
      has_role(auth.uid(), church_id, 'consolidacao'::app_role) OR
      (has_role(auth.uid(), church_id, 'lider_celula'::app_role) AND leader_id = get_user_member_id(auth.uid()))
    )
  );